import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { Transaction, TransactionStatus } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}


  async create(senderId: string, createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const { receiverId, amountInCents, description } = createTransactionDto;

    if (senderId === receiverId) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    return this.dataSource.transaction(async manager => {
      // Validate that both users exist before starting the transaction
      const usersExist = await manager.count(User, {
        where: [{ id: senderId }, { id: receiverId }]
      });
      
      if (usersExist !== 2) {
        throw new BadRequestException('One or both users not found');
      }
      // Get both users with pessimistic lock within the same transaction
      // Order by ID to prevent deadlocks when multiple transactions access same users
      const userIds = [senderId, receiverId].sort();
      const users = await manager.find(User, { 
        where: userIds.map(id => ({ id })),
        order: { id: 'ASC' },
        lock: { mode: 'pessimistic_write' }
      });

      if (users.length !== 2) {
        throw new BadRequestException('User not found');
      }

      const sender = users.find(u => u.id === senderId);
      const receiver = users.find(u => u.id === receiverId);

      if (!sender || !receiver) {
        throw new BadRequestException('User not found');
      }
      
      if (sender.balanceInCents < amountInCents) {
        throw new BadRequestException('Insufficient balance');
      }

      const transaction = manager.create(Transaction, {
        senderId,
        receiverId,
        amountInCents,
        description,
        status: TransactionStatus.PENDING,
      });

      const savedTransaction = await manager.save(transaction);

      // Update balances within the same transaction
      sender.balanceInCents -= amountInCents;
      receiver.balanceInCents += amountInCents;

      await manager.save(sender);
      await manager.save(receiver);

      savedTransaction.status = TransactionStatus.COMPLETED;
      return manager.save(savedTransaction);
    });
  }

  async findById(id: string): Promise<any> {
    const result = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.sender', 'sender')
      .leftJoin('transaction.receiver', 'receiver')
      .select([
        'transaction.id as id',
        'transaction.senderId as senderId', 
        'transaction.receiverId as receiverId',
        'transaction.amountInCents as amountInCents',
        'transaction.description as description',
        'transaction.status as status',
        'transaction.reversalReason as reversalReason',
        'transaction.createdAt as createdAt',
        'transaction.updatedAt as updatedAt',
        'sender.id as sender_id',
        'sender.email as sender_email', 
        'sender.name as sender_name',
        'receiver.id as receiver_id',
        'receiver.email as receiver_email',
        'receiver.name as receiver_name'
      ])
      .where('transaction.id = :id', { id })
      .getRawOne();

    if (!result) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      id: result.id,
      senderId: result.senderId,
      receiverId: result.receiverId,
      amountInCents: result.amountInCents,
      description: result.description,
      status: result.status,
      reversalReason: result.reversalReason,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      sender: {
        id: result.sender_id,
        email: result.sender_email,
        name: result.sender_name
      },
      receiver: {
        id: result.receiver_id,
        email: result.receiver_email,
        name: result.receiver_name
      }
    };
  }

  async findByUserId(userId: string): Promise<any[]> {
    const result = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.sender', 'sender')
      .leftJoin('transaction.receiver', 'receiver')
      .select([
        'transaction.id as id',
        'transaction.senderId as senderId', 
        'transaction.receiverId as receiverId',
        'transaction.amountInCents as amountInCents',
        'transaction.description as description',
        'transaction.status as status',
        'transaction.reversalReason as reversalReason',
        'transaction.createdAt as createdAt',
        'transaction.updatedAt as updatedAt',
        'sender.id as sender_id',
        'sender.email as sender_email', 
        'sender.name as sender_name',
        'receiver.id as receiver_id',
        'receiver.email as receiver_email',
        'receiver.name as receiver_name'
      ])
      .where('transaction.senderId = :userId OR transaction.receiverId = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC')
      .getRawMany();

    return result.map(row => ({
      id: row.id,
      senderId: row.senderId,
      receiverId: row.receiverId,
      amountInCents: row.amountInCents,
      description: row.description,
      status: row.status,
      reversalReason: row.reversalReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      sender: {
        id: row.sender_id,
        email: row.sender_email,
        name: row.sender_name
      },
      receiver: {
        id: row.receiver_id,
        email: row.receiver_email,
        name: row.receiver_name
      }
    }));
  }

  private async findTransactionForReverse(transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async reverse(transactionId: string, userId: string, reverseDto: ReverseTransactionDto): Promise<Transaction> {
    const transaction = await this.findTransactionForReverse(transactionId);

    if (transaction.senderId !== userId && transaction.receiverId !== userId) {
      throw new BadRequestException('You can only reverse your own transactions');
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException('Only completed transactions can be reversed');
    }

    return this.dataSource.transaction(async manager => {
      const userIds = [transaction.senderId, transaction.receiverId].sort();
      const users = await manager.find(User, { 
        where: userIds.map(id => ({ id })),
        order: { id: 'ASC' },
        lock: { mode: 'pessimistic_write' }
      });

      if (users.length !== 2) {
        throw new BadRequestException('User not found');
      }

      const sender = users.find(u => u.id === transaction.senderId);
      const receiver = users.find(u => u.id === transaction.receiverId);

      if (!sender || !receiver) {
        throw new BadRequestException('User not found');
      }

      sender.balanceInCents += transaction.amountInCents;
      receiver.balanceInCents -= transaction.amountInCents;

      await manager.save(sender);
      await manager.save(receiver);

      transaction.status = TransactionStatus.REVERSED;
      transaction.reversalReason = reverseDto.reason || 'Requested by user';

      return manager.save(transaction);
    });
  }
}
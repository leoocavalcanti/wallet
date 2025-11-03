import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionStatus } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  async create(senderId: string, createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const { receiverId, amountInCents, description } = createTransactionDto;

    if (senderId === receiverId) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    await this.usersService.findById(senderId);
    await this.usersService.findById(receiverId);

    return this.dataSource.transaction(async manager => {
      const senderBalance = await this.usersService.getBalance(senderId);
      
      if (senderBalance < amountInCents) {
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

      await this.usersService.updateBalance(senderId, -amountInCents);
      await this.usersService.updateBalance(receiverId, amountInCents);

      savedTransaction.status = TransactionStatus.COMPLETED;
      return manager.save(savedTransaction);
    });
  }

  async findById(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: [
        { senderId: userId },
        { receiverId: userId }
      ],
      relations: ['sender', 'receiver'],
      order: { createdAt: 'DESC' },
    });
  }

  async reverse(transactionId: string, userId: string, reverseDto: ReverseTransactionDto): Promise<Transaction> {
    const transaction = await this.findById(transactionId);

    if (transaction.senderId !== userId && transaction.receiverId !== userId) {
      throw new BadRequestException('You can only reverse your own transactions');
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException('Only completed transactions can be reversed');
    }

    return this.dataSource.transaction(async manager => {
      await this.usersService.updateBalance(transaction.senderId, transaction.amountInCents);
      await this.usersService.updateBalance(transaction.receiverId, -transaction.amountInCents);

      transaction.status = TransactionStatus.REVERSED;
      transaction.reversalReason = reverseDto.reason || 'Requested by user';

      return manager.save(transaction);
    });
  }
}
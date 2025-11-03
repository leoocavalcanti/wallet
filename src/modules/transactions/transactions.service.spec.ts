import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { Transaction, TransactionStatus } from './transaction.entity';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repository: Repository<Transaction>;
  let usersService: UsersService;
  let dataSource: DataSource;

  const mockTransaction: Transaction = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    senderId: '123e4567-e89b-12d3-a456-426614174000',
    receiverId: '123e4567-e89b-12d3-a456-426614174001',
    amountInCents: 5000,
    description: 'Test transfer',
    status: TransactionStatus.COMPLETED,
    reversalReason: null,
    sender: null,
    receiver: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
    getBalance: jest.fn(),
    updateBalance: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    repository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
    usersService = module.get<UsersService>(UsersService);
    dataSource = module.get<DataSource>(DataSource);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createTransactionDto: CreateTransactionDto = {
      receiverId: '123e4567-e89b-12d3-a456-426614174001',
      amountInCents: 5000,
      description: 'Test transfer',
    };

    it('should create a transaction successfully', async () => {
      const senderId = '123e4567-e89b-12d3-a456-426614174000';
      
      mockUsersService.findById.mockResolvedValue({});
      mockUsersService.getBalance.mockResolvedValue(10000);
      mockUsersService.updateBalance.mockResolvedValue(undefined);

      const mockManager = {
        create: jest.fn().mockReturnValue(mockTransaction),
        save: jest.fn().mockResolvedValue(mockTransaction),
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      const result = await service.create(senderId, createTransactionDto);

      expect(mockUsersService.findById).toHaveBeenCalledWith(senderId);
      expect(mockUsersService.findById).toHaveBeenCalledWith(createTransactionDto.receiverId);
      expect(mockUsersService.getBalance).toHaveBeenCalledWith(senderId);
      expect(mockUsersService.updateBalance).toHaveBeenCalledWith(senderId, -5000);
      expect(mockUsersService.updateBalance).toHaveBeenCalledWith(createTransactionDto.receiverId, 5000);
      expect(result).toEqual(mockTransaction);
    });

    it('should throw BadRequestException for self-transfer', async () => {
      const senderId = '123e4567-e89b-12d3-a456-426614174000';
      const selfTransferDto = { ...createTransactionDto, receiverId: senderId };

      await expect(service.create(senderId, selfTransferDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const senderId = '123e4567-e89b-12d3-a456-426614174000';
      
      mockUsersService.findById.mockResolvedValue({});
      mockUsersService.getBalance.mockResolvedValue(1000); // Less than required amount

      const mockManager = {};
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await expect(service.create(senderId, createTransactionDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return transaction if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.findById(mockTransaction.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
        relations: ['sender', 'receiver'],
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUserId', () => {
    it('should return user transactions', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const transactions = [mockTransaction];

      mockRepository.find.mockResolvedValue(transactions);

      const result = await service.findByUserId(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: [
          { senderId: userId },
          { receiverId: userId }
        ],
        relations: ['sender', 'receiver'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(transactions);
    });
  });

  describe('reverse', () => {
    const reverseDto: ReverseTransactionDto = {
      reason: 'User requested reversal',
    };

    it('should reverse transaction successfully', async () => {
      const userId = mockTransaction.senderId;
      
      jest.spyOn(service, 'findById').mockResolvedValue(mockTransaction);
      mockUsersService.updateBalance.mockResolvedValue(undefined);

      const reversedTransaction = { ...mockTransaction, status: TransactionStatus.REVERSED };
      const mockManager = {
        save: jest.fn().mockResolvedValue(reversedTransaction),
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      const result = await service.reverse(mockTransaction.id, userId, reverseDto);

      expect(service.findById).toHaveBeenCalledWith(mockTransaction.id);
      expect(mockUsersService.updateBalance).toHaveBeenCalledWith(mockTransaction.senderId, mockTransaction.amountInCents);
      expect(mockUsersService.updateBalance).toHaveBeenCalledWith(mockTransaction.receiverId, -mockTransaction.amountInCents);
      expect(result.status).toBe(TransactionStatus.REVERSED);
    });

    it('should throw BadRequestException if user is not part of the transaction', async () => {
      const unauthorizedUserId = 'unauthorized-user-id';
      
      jest.spyOn(service, 'findById').mockResolvedValue(mockTransaction);

      await expect(service.reverse(mockTransaction.id, unauthorizedUserId, reverseDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if transaction is not completed', async () => {
      const pendingTransaction = { ...mockTransaction, status: TransactionStatus.PENDING };
      
      jest.spyOn(service, 'findById').mockResolvedValue(pendingTransaction);

      await expect(service.reverse(mockTransaction.id, mockTransaction.senderId, reverseDto)).rejects.toThrow(BadRequestException);
    });
  });
});
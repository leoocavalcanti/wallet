import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;
  let dataSource: DataSource;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    balanceInCents: 10000,
    sentTransactions: [],
    receivedTransactions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      balanceInCents: 10000,
    };

    it('should create a user successfully', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email }
      });
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserDto.email }
      });
    });
  });

  describe('findByEmail', () => {
    it('should return user if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('test@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id }
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword('password123', 'hashedPassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword('wrongpassword', 'hashedPassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
      expect(result).toBe(false);
    });
  });

  describe('updateBalance', () => {
    it('should update user balance successfully', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockUser),
        save: jest.fn().mockResolvedValue({ ...mockUser, balanceInCents: 15000 }),
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await service.updateBalance(mockUser.id, 5000);

      expect(mockManager.findOne).toHaveBeenCalledWith(User, {
        where: { id: mockUser.id },
        lock: { mode: 'pessimistic_write' }
      });
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(null),
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await expect(service.updateBalance('nonexistent-id', 5000)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockUser),
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });

      await expect(service.updateBalance(mockUser.id, -15000)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBalance', () => {
    it('should return user balance', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);

      const result = await service.getBalance(mockUser.id);

      expect(service.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toBe(mockUser.balanceInCents);
    });
  });
});
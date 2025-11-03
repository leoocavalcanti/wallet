import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { User } from '../users/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

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

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    validatePassword: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      balanceInCents: 10000,
    };

    it('should register user successfully', async () => {
      const token = 'jwt-token';
      
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.register(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          balanceInCents: mockUser.balanceInCents,
          sentTransactions: mockUser.sentTransactions,
          receivedTransactions: mockUser.receivedTransactions,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
        token,
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const token = 'jwt-token';
      
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUsersService.validatePassword).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          balanceInCents: mockUser.balanceInCents,
          sentTransactions: mockUser.sentTransactions,
          receivedTransactions: mockUser.receivedTransactions,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
        token,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.validatePassword).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockUser.id);

      expect(mockUsersService.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });
  });
});
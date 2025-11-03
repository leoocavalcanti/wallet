import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async updateBalance(userId: string, amountInCents: number): Promise<void> {
    await this.dataSource.transaction(async manager => {
      const user = await manager.findOne(User, { 
        where: { id: userId },
        lock: { mode: 'pessimistic_write' }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const newBalance = user.balanceInCents + amountInCents;
      
      if (newBalance < 0) {
        throw new BadRequestException('Insufficient balance');
      }

      user.balanceInCents = newBalance;
      await manager.save(user);
    });
  }

  async getBalance(userId: string): Promise<number> {
    const user = await this.findById(userId);
    return user.balanceInCents;
  }
}
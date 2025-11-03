import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{ user: Omit<User, 'password'>, token: string }> {
    const user = await this.usersService.create(createUserDto);
    const token = this.generateToken(user.id, user.email);
    
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(loginDto: LoginUserDto): Promise<{ user: Omit<User, 'password'>, token: string }> {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(loginDto.password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email);
    const { password, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, token };
  }

  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }

  async validateUser(userId: string): Promise<User> {
    return this.usersService.findById(userId);
  }
}
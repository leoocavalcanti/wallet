import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.userId);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get user balance' })
  @ApiResponse({ status: 200, description: 'User balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBalance(@Request() req) {
    const balanceInCents = await this.usersService.getBalance(req.user.userId);
    return {
      balanceInCents,
      balanceInReais: balanceInCents / 100
    };
  }
}
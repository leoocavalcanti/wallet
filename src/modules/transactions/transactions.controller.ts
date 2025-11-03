import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.userId, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user transactions' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findUserTransactions(@Request() req) {
    return this.transactionsService.findByUserId(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findById(id);
  }

  @Patch(':id/reverse')
  @ApiOperation({ summary: 'Reverse a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction reversed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async reverse(
    @Param('id') id: string,
    @Request() req,
    @Body() reverseDto: ReverseTransactionDto
  ) {
    return this.transactionsService.reverse(id, req.user.userId, reverseDto);
  }
}
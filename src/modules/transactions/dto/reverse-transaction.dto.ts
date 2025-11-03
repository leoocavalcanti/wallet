import { IsString, IsOptional } from 'class-validator';

export class ReverseTransactionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
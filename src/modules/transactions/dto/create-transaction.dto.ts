import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsUUID()
  receiverId: string;

  @IsInt()
  @Min(1)
  amountInCents: number;

  @IsOptional()
  @IsString()
  description?: string;
}
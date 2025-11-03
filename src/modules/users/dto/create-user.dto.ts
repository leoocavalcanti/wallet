import { IsEmail, IsString, MinLength, IsOptional, IsInt, Min } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  balanceInCents?: number = 0;
}
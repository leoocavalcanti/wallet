import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule, UsersModule, TransactionsModule } from './modules';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ms }) => {
              return `${timestamp} [${level}] ${message} ${ms}`;
            }),
          ),
        }),
      ],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    TransactionsModule,
  ],
})
export class AppModule {}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REVERSED = 'reversed',
  FAILED = 'failed'
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  senderId: string;

  @Column('uuid')
  receiverId: string;

  @Column({ type: 'integer' })
  amountInCents: number;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING
  })
  status: TransactionStatus;

  @Column({ nullable: true })
  reversalReason?: string;

  @ManyToOne(() => User, user => user.sentTransactions)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ManyToOne(() => User, user => user.receivedTransactions)
  @JoinColumn({ name: 'receiverId' })
  receiver: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ type: 'integer', default: 0 })
  balanceInCents: number;

  @OneToMany(() => Transaction, transaction => transaction.sender)
  sentTransactions: Transaction[];

  @OneToMany(() => Transaction, transaction => transaction.receiver)
  receivedTransactions: Transaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
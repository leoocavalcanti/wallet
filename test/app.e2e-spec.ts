import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User, Transaction } from '../src/modules';

describe('Financial Wallet App (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;
  let secondUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();

    dataSource = app.get<DataSource>(DataSource);
    
    // Clean database before tests
    await dataSource.getRepository(Transaction).delete({});
    await dataSource.getRepository(User).delete({});
  });

  afterAll(async () => {
    // Clean database after tests
    await dataSource.getRepository(Transaction).delete({});
    await dataSource.getRepository(User).delete({});
    await app.close();
  });

  describe('Authentication', () => {
    describe('/auth/register (POST)', () => {
      it('should register a new user', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User',
            balanceInCents: 100000, // R$ 1000.00
          })
          .expect(201);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe('test@example.com');
        expect(response.body.user.name).toBe('Test User');
        expect(response.body.user.balanceInCents).toBe(100000);
        expect(response.body.user).not.toHaveProperty('password');

        authToken = response.body.token;
        userId = response.body.user.id;
      });

      it('should not register user with duplicate email', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'test@example.com',
            password: 'password123',
            name: 'Another User',
          })
          .expect(409);
      });

      it('should validate required fields', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'invalid-email',
            password: '123', // Too short
          })
          .expect(400);
      });
    });

    describe('/auth/login (POST)', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123',
          })
          .expect(200);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe('test@example.com');
      });

      it('should not login with invalid credentials', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })
          .expect(401);
      });
    });
  });

  describe('Users', () => {
    beforeAll(async () => {
      // Create second user for transfer tests
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'second@example.com',
          password: 'password123',
          name: 'Second User',
          balanceInCents: 50000, // R$ 500.00
        });
      
      secondUserId = response.body.user.id;
    });

    describe('/users/profile (GET)', () => {
      it('should get user profile with valid token', async () => {
        const response = await request(app.getHttpServer())
          .get('/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.email).toBe('test@example.com');
        expect(response.body.name).toBe('Test User');
        expect(response.body).not.toHaveProperty('password');
      });

      it('should not get profile without token', async () => {
        await request(app.getHttpServer())
          .get('/users/profile')
          .expect(401);
      });
    });

    describe('/users/balance (GET)', () => {
      it('should get user balance', async () => {
        const response = await request(app.getHttpServer())
          .get('/users/balance')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.balanceInCents).toBe(100000);
        expect(response.body.balanceInReais).toBe(1000);
      });
    });
  });

  describe('Transactions', () => {
    let transactionId: string;

    describe('/transactions (POST)', () => {
      it('should create a transaction', async () => {
        const response = await request(app.getHttpServer())
          .post('/transactions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            receiverId: secondUserId,
            amountInCents: 25000, // R$ 250.00
            description: 'Test transfer',
          })
          .expect(201);

        expect(response.body.senderId).toBe(userId);
        expect(response.body.receiverId).toBe(secondUserId);
        expect(response.body.amountInCents).toBe(25000);
        expect(response.body.description).toBe('Test transfer');
        expect(response.body.status).toBe('completed');

        transactionId = response.body.id;
      });

      it('should not create transaction to self', async () => {
        await request(app.getHttpServer())
          .post('/transactions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            receiverId: userId, // Same as sender
            amountInCents: 25000,
          })
          .expect(400);
      });

      it('should not create transaction with insufficient balance', async () => {
        await request(app.getHttpServer())
          .post('/transactions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            receiverId: secondUserId,
            amountInCents: 1000000, // More than balance
          })
          .expect(400);
      });

      it('should validate transaction data', async () => {
        await request(app.getHttpServer())
          .post('/transactions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            receiverId: 'invalid-uuid',
            amountInCents: -100, // Negative amount
          })
          .expect(400);
      });
    });

    describe('/transactions (GET)', () => {
      it('should get user transactions', async () => {
        const response = await request(app.getHttpServer())
          .get('/transactions')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('sender');
        expect(response.body[0]).toHaveProperty('receiver');
      });
    });

    describe('/transactions/:id (GET)', () => {
      it('should get transaction by id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/transactions/${transactionId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(transactionId);
        expect(response.body.amountInCents).toBe(25000);
      });

      it('should return 404 for non-existent transaction', async () => {
        await request(app.getHttpServer())
          .get('/transactions/550e8400-e29b-41d4-a716-446655440000')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('/transactions/:id/reverse (PATCH)', () => {
      it('should reverse a transaction', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/transactions/${transactionId}/reverse`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            reason: 'User requested reversal',
          })
          .expect(200);

        expect(response.body.status).toBe('reversed');
        expect(response.body.reversalReason).toBe('User requested reversal');
      });

      it('should not reverse already reversed transaction', async () => {
        await request(app.getHttpServer())
          .patch(`/transactions/${transactionId}/reverse`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            reason: 'Second reversal attempt',
          })
          .expect(400);
      });
    });

    describe('Balance verification after transactions', () => {
      it('should have correct balances after reversal', async () => {
        // Check sender balance (should be back to original)
        const senderResponse = await request(app.getHttpServer())
          .get('/users/balance')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(senderResponse.body.balanceInCents).toBe(100000); // Back to original

        // Check receiver balance by logging in as second user
        const loginResponse = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'second@example.com',
            password: 'password123',
          });

        const receiverResponse = await request(app.getHttpServer())
          .get('/users/balance')
          .set('Authorization', `Bearer ${loginResponse.body.token}`)
          .expect(200);

        expect(receiverResponse.body.balanceInCents).toBe(50000); // Back to original
      });
    });
  });

  describe('Security', () => {
    it('should require authentication for protected routes', async () => {
      await request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);

      await request(app.getHttpServer())
        .post('/transactions')
        .expect(401);
    });

    it('should handle invalid tokens', async () => {
      await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
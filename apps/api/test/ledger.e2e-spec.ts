import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { LedgerController } from '../src/ledger/ledger.controller';
import { LedgerService } from '../src/ledger/ledger.service';

describe('LedgerController (e2e)', () => {
  let app: INestApplication;

  const mockLedgerService = {
    postTransaction: jest.fn().mockResolvedValue({ success: true, transaction_id: '123' }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [LedgerController],
      providers: [
        {
          provide: LedgerService,
          useValue: mockLedgerService,
        },
      ],
    })
    // Bypassing guard for unit testing adapter logic
    .overrideGuard('SupabaseAuthGuard').useValue({ canActivate: () => true })
    .compile();

    app = moduleFixture.createNestApplication();
    
    // Mock user injection since we bypassed guard
    app.use((req: any, res: any, next: any) => {
      req.user = { userId: 'test-user-id' };
      next();
    });

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/v1/transactions (POST) - Maps flat expense payload to double entry', () => {
    return request(app.getHttpServer())
      .post('/v1/transactions')
      .send({
        transaction_type: 'expense',
        transaction_date: '2026-09-01',
        title: 'Uber',
        amount: 500,
        account_id: 'acc-1',
      })
      .expect(201)
      .expect({
        success: true,
        transaction_id: '123',
      })
      .then(() => {
        expect(mockLedgerService.postTransaction).toHaveBeenCalledWith(
          'test-user-id',
          expect.objectContaining({
            entries: [
              { account_id: 'acc-1', amount: 500, type: 'credit', currency: 'BDT' },
              { account_id: 'acc-1', amount: 500, type: 'debit', currency: 'BDT' },
            ]
          })
        );
      });
  });
});

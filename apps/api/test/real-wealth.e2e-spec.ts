import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('RealWealthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/real-wealth/scenario (POST) - fails without auth', () => {
    return request(app.getHttpServer())
      .post('/real-wealth/scenario')
      .send({ assetId: '123', assumedGrowthRate: 0.08 })
      .expect(401);
  });
});

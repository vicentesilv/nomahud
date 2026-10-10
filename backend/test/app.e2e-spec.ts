import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module';

process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '3308';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'root';
process.env.DB_NAME = 'nomadhud_e2e';
process.env.JWT_SECRET = 'e2e-secret-min-32-chars-para-tests';
process.env.SMTP_HOST = '';
process.env.BREVO_API_KEY = '';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    const dataSource = app.get(DataSource);
    if (!dataSource.isInitialized) await dataSource.initialize();
  }, 120000);

  afterAll(async () => {
    await app.close();
  });

  it('/salud (GET)', () => {
    return request(app.getHttpServer()).get('/salud').expect(200).expect((res) => {
      if (res.body.db !== true) throw new Error('DB no disponible en e2e');
    });
  });
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      // Los avatares/documentos se sirven desde otro origen en dev (:3001 vs :3000)
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = frontendUrl.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, 
      transform: true,
    })
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Servidor corriendo en el puerto ${process.env.PORT ?? 3000}`);
}
bootstrap();

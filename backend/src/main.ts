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
  const allowedOrigins = frontendUrl
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  // Flag TEMPORAL para debug: CORS_ABIERTO=true refleja cualquier origen.
  // No dejar activado en produccion: permite a cualquier web llamar a la API con credenciales.
  const aperturaTotal = process.env.CORS_ABIERTO === 'true';
  if (aperturaTotal) {
    console.warn(
      'CORS_ABIERTO=true: permitiendo cualquier origen (solo debug temporal)',
    );
  }
  app.enableCors({
    origin: aperturaTotal
      ? true
      : allowedOrigins.length === 1
        ? allowedOrigins[0]
        : allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Servidor corriendo en el puerto ${process.env.PORT ?? 3000}`);
}
bootstrap();

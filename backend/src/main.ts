import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefixo global para todas as rotas
  app.setGlobalPrefix('api/v1');

  // Validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Documentação Swagger
  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Sistema Financeiro Pessoal API')
      .setDescription('API para controle financeiro pessoal')
      .setVersion('1.0')
      .addBearerAuth(
        {
          description: 'JWT Authorization header using the Bearer scheme.',
          name: 'Authorization',
          bearerFormat: 'Bearer',
          scheme: 'bearer',
          type: 'http',
          in: 'Header'
        },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
  console.log(`📖 Documentação Swagger em: http://localhost:${port}/api/docs`);
}

bootstrap();

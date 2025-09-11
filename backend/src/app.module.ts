import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { User } from './database/entities/user.entity';
import { Profile } from './database/entities/profile.entity';
import { CategoriaFinanceira } from './database/entities/categoria.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Configuração global de environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),

    // Configuração do banco de dados
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Entidades do TypeORM
    TypeOrmModule.forFeature([
      User,
      Profile,
      CategoriaFinanceira,
    ]),

    // Módulo de saúde da aplicação
    HealthModule,

    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { getDatabaseConfig } from './config/database.config';
import { User } from './database/entities/user.entity';
import { Profile } from './database/entities/profile.entity';
import { FinancialCategory } from './database/entities/financial-category.entity';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { CategoriesModule } from './categories/categories.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AuthModule } from './auth/auth.module';
import { FinancialMovementsModule } from './financial-movements/financial-movements.module';
import { FinancialMovement } from './database/entities/financial-movement.entity';
import { CreditCardsModule } from './credit-cards/credit-cards.module';
import { BudgetsModule } from './budgets/budgets.module';
import { DebtsModule } from './debts/debts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReservesModule } from './reserves/reserves.module';
import { ReportsModule } from './reports/reports.module';
import { RecurringTransactionsModule } from './recurring-transactions/recurring-transactions.module';
import { RecurringTransaction } from './database/entities/recurring-transaction.entity';
import { ScenariosModule } from './scenarios/scenarios.module';
import { ImportsModule } from './imports/imports.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // Configuração global de environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.test', '.env.development', '.env'],
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
      FinancialCategory,
      FinancialMovement,
      RecurringTransaction,
    ]),

    // Módulo de saúde da aplicação
    HealthModule,

    UsersModule,

    ProfilesModule,

    CategoriesModule,

    AuthModule,

    FinancialMovementsModule,
    CreditCardsModule,
    BudgetsModule,
    DebtsModule,
    NotificationsModule,
    ReservesModule,
    ReportsModule,
    RecurringTransactionsModule,
    ScenariosModule,
    ImportsModule,
    ImportsModule,
    AuditLogsModule,
    DashboardModule,

    // Agendamento de Tarefas (Cron)
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL }); // Log para todas as rotas
  }
}

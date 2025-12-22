import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringTransactionsService } from './recurring-transactions.service';

@Injectable()
export class RecurringTasksService {
  private readonly logger = new Logger(RecurringTasksService.name);

  constructor(
    private readonly recurringService: RecurringTransactionsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug('Iniciando processamento de transações recorrentes...');
    await this.recurringService.processPendingTransactions();
    this.logger.debug('Processamento concluído.');
  }
}

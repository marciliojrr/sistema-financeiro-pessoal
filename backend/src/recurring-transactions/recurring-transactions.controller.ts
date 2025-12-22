import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('recurring-transactions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('recurring-transactions')
export class RecurringTransactionsController {
  constructor(
    private readonly recurringService: RecurringTransactionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova transação recorrente' })
  create(@Body() createDto: CreateRecurringTransactionDto, @Req() req) {
    return this.recurringService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista todas as transações recorrentes do usuário',
  })
  findAll(@Req() req) {
    return this.recurringService.findAllByUser(req.user.userId);
  }

  @Get('profile/:profileId')
  @ApiOperation({
    summary: 'Lista transações recorrentes de um perfil específico',
  })
  findByProfile(@Param('profileId') profileId: string, @Req() req) {
    return this.recurringService.findAll(profileId, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.recurringService.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRecurringTransactionDto,
    @Req() req,
  ) {
    return this.recurringService.update(id, updateDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.recurringService.remove(id, req.user.userId);
  }

  @Post('trigger-cron')
  @ApiOperation({
    summary: 'Força a execução manual da verificação de recorrencia (Dev/Test)',
  })
  triggerCron() {
    return this.recurringService.processPendingTransactions();
  }
}

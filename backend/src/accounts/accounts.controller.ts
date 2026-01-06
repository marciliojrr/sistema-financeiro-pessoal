import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar nova conta bancária' })
  async create(@Request() req: any, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as contas do usuário' })
  async findAll(
    @Request() req: any,
    @Query('profileId') profileId?: string,
  ) {
    return this.accountsService.findAll(req.user.userId, profileId);
  }

  @Get('total-balance')
  @ApiOperation({ summary: 'Obter saldo total de todas as contas' })
  async getTotalBalance(@Request() req: any) {
    return this.accountsService.getTotalBalance(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter conta por ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.accountsService.findOne(id, req.user.userId);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Obter saldo atual da conta com movimentações' })
  async getBalance(@Request() req: any, @Param('id') id: string) {
    return this.accountsService.getBalanceWithMovements(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar conta' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir conta (soft delete)' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.accountsService.remove(id, req.user.userId);
  }
}

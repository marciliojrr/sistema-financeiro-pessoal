import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../database/entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Profile } from '../database/entities/profile.entity';
import { FinancialMovement, MovementType } from '../database/entities/financial-movement.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(FinancialMovement)
    private readonly movementRepository: Repository<FinancialMovement>,
  ) {}

  async create(userId: string, data: CreateAccountDto) {
    const profile = await this.profileRepository.findOne({
      where: { id: data.profileId },
      relations: ['user'],
    });

    if (!profile) throw new NotFoundException('Perfil não encontrado.');
    if (profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    const account = this.accountRepository.create({
      name: data.name,
      bank: data.bank,
      type: data.type,
      initialBalance: data.initialBalance,
      profile,
    });

    return this.accountRepository.save(account);
  }

  async findAll(userId: string, profileId?: string) {
    const query = this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.profile', 'profile')
      .leftJoin('profile.user', 'user')
      .where('user.id = :userId', { userId });

    if (profileId) {
      query.andWhere('profile.id = :profileId', { profileId });
    }

    const accounts = await query.orderBy('account.createdAt', 'DESC').getMany();

    // Calculate current balance for each account
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        const balanceData = await this.getBalanceWithMovements(
          account.id,
          userId,
        );
        return {
          ...account,
          currentBalance: balanceData.currentBalance,
        };
      }),
    );

    return accountsWithBalance;
  }

  async findOne(id: string, userId: string) {
    const account = await this.accountRepository.findOne({
      where: { id },
      relations: ['profile', 'profile.user'],
    });

    if (!account) throw new NotFoundException('Conta não encontrada.');
    if (account.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    return account;
  }

  async update(id: string, userId: string, data: UpdateAccountDto) {
    const account = await this.findOne(id, userId);

    Object.assign(account, data);

    return this.accountRepository.save(account);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.accountRepository.softDelete(id);
    return { deleted: true };
  }

  /**
   * Calcula o saldo atual da conta: saldo inicial + receitas - despesas
   * vinculadas ao mesmo perfil da conta.
   */
  async getBalanceWithMovements(id: string, userId: string) {
    const account = await this.findOne(id, userId);

    // Buscar movimentações desta conta específica
    const movements = await this.movementRepository.find({
      where: {
        account: { id: account.id },
        scenarioId: null as any, // Apenas movimentações reais, não de cenário
      },
    });

    let balance = Number(account.initialBalance);

    for (const mov of movements) {
      // INCOME e TRANSFER_IN somam ao saldo (dinheiro entrando)
      // EXPENSE e TRANSFER_OUT subtraem do saldo (dinheiro saindo)
      if (mov.type === MovementType.INCOME || mov.type === MovementType.TRANSFER_IN) {
        balance += Number(mov.amount);
      } else {
        balance -= Number(mov.amount);
      }
    }

    return {
      account,
      initialBalance: Number(account.initialBalance),
      currentBalance: balance,
      movementsCount: movements.length,
    };
  }

  /**
   * Retorna o saldo total de todas as contas do usuário
   */
  async getTotalBalance(userId: string) {
    const accounts = await this.findAll(userId);

    let totalInitialBalance = 0;
    for (const acc of accounts) {
      totalInitialBalance += Number(acc.initialBalance);
    }

    // Buscar todas as movimentações do usuário (sem cenário)
    const movements = await this.movementRepository
      .createQueryBuilder('mov')
      .leftJoin('mov.profile', 'profile')
      .leftJoin('profile.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('mov.scenarioId IS NULL')
      .getMany();

    let movementsBalance = 0;
    for (const mov of movements) {
      // INCOME e TRANSFER_IN somam ao saldo (dinheiro entrando)
      // EXPENSE e TRANSFER_OUT subtraem do saldo (dinheiro saindo)
      if (mov.type === MovementType.INCOME || mov.type === MovementType.TRANSFER_IN) {
        movementsBalance += Number(mov.amount);
      } else {
        movementsBalance -= Number(mov.amount);
      }
    }

    return {
      totalInitialBalance,
      movementsBalance,
      totalBalance: totalInitialBalance + movementsBalance,
      accountsCount: accounts.length,
    };
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debt } from '../database/entities/debt.entity';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { Profile } from '../database/entities/profile.entity';
import { FinancialCategory } from '../database/entities/financial-category.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(Debt)
    private readonly debtRepository: Repository<Debt>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(FinancialCategory)
    private readonly categoryRepository: Repository<FinancialCategory>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(userId: string, data: CreateDebtDto) {
    // Validate Profile
    const profile = await this.profileRepository.findOne({
      where: { id: data.profileId },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Perfil não encontrado.');
    if (profile.user.id !== userId)
      throw new ForbiddenException(
        'Acesso negado. Você só pode criar dívidas para seus próprios perfis.',
      );

    // Validate Category (if provided)
    let category: FinancialCategory | null = null;
    if (data.categoryId) {
      category = await this.categoryRepository.findOne({
        where: { id: data.categoryId },
      });
      if (!category) throw new NotFoundException('Categoria não encontrada.');
    }

    const debt = this.debtRepository.create({
      ...data,
      remainingAmount: data.totalAmount, // Initial remaining amount is total amount
      profile,
      category: category ?? undefined,
    });

    return this.debtRepository.save(debt);
  }

  async findAll(userId: string, filters: { profileId?: string }) {
    const query = this.debtRepository
      .createQueryBuilder('debt')
      .leftJoinAndSelect('debt.profile', 'profile')
      .leftJoinAndSelect('debt.category', 'category')
      .leftJoin('profile.user', 'user')
      .where('user.id = :userId', { userId });

    if (filters.profileId) {
      query.andWhere('profile.id = :profileId', {
        profileId: filters.profileId,
      });
    }

    return query.orderBy('debt.createdAt', 'DESC').getMany();
  }

  async findOne(id: string, userId: string) {
    const debt = await this.debtRepository.findOne({
      where: { id },
      relations: ['profile', 'profile.user', 'category'],
    });

    if (!debt) throw new NotFoundException('Dívida não encontrada.');
    if (debt.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    return debt;
  }

  async update(id: string, userId: string, data: UpdateDebtDto) {
    const debt = await this.findOne(id, userId);

    // Basic update
    const { ...updateData } = data;

    // Handle category update if provided
    if (updateData.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateData.categoryId },
      });
      if (!category) throw new NotFoundException('Categoria não encontrada.');
      debt.category = category;
    }

    const oldDebt = { ...debt };

    // remove fields that shouldn't be updated directly via spread if needed, or rely on DTO whitelist
    // However, we need to map the rest of properties
    Object.assign(debt, updateData);

    // If updating category to null/undefined via DTO, we might need specific handling,
    // but since categoryId is optional in DTO, it updates if present.

    const savedDebt = await this.debtRepository.save(debt);

    await this.auditLogsService.logChange(
      userId,
      'UPDATE',
      'Debt',
      savedDebt.id,
      { old: oldDebt, new: savedDebt },
    );

    return savedDebt;
  }

  async remove(id: string, userId: string) {
    const debt = await this.findOne(id, userId);
    await this.debtRepository.softDelete(id);

    await this.auditLogsService.logChange(userId, 'DELETE', 'Debt', id, {
      old: debt,
    });

    return { deleted: true };
  }

  /**
   * Recalcula o saldo devedor baseado nos pagamentos feitos.
   * Chamado após a criação de um FinancialMovement com debtId.
   */
  async recalculateRemainingAmount(
    debtId: string,
    paymentAmount: number,
  ): Promise<Debt> {
    const debt = await this.debtRepository.findOne({ where: { id: debtId } });
    if (!debt) throw new NotFoundException('Dívida não encontrada.');

    debt.remainingAmount = Number(debt.remainingAmount) - Number(paymentAmount);

    // Incrementa parcelas pagas (assumindo 1 pagamento = 1 parcela)
    debt.paidInstallments = Number(debt.paidInstallments) + 1;

    // Se zerou o saldo, marca como inativa
    if (debt.remainingAmount <= 0) {
      debt.remainingAmount = 0;
      debt.active = false;
    }

    return this.debtRepository.save(debt);
  }

  /**
   * Calcula juros acumulados desde a data de início até hoje.
   * Juros simples: Principal * Taxa * Meses
   */
  calculateAccruedInterest(debt: Debt): number {
    if (!debt.interestRate || debt.interestRate === 0) return 0;

    const now = new Date();
    const startDate = new Date(debt.startDate);
    const monthsDiff =
      (now.getFullYear() - startDate.getFullYear()) * 12 +
      (now.getMonth() - startDate.getMonth());

    // Juros simples sobre o total original
    const interest =
      Number(debt.totalAmount) * (Number(debt.interestRate) / 100) * monthsDiff;
    return interest;
  }

  /**
   * Retorna a dívida com juros calculados (para exibição)
   */
  async findOneWithInterest(id: string, userId: string) {
    const debt = await this.findOne(id, userId);
    const accruedInterest = this.calculateAccruedInterest(debt);
    return {
      ...debt,
      accruedInterest,
      totalWithInterest: Number(debt.remainingAmount) + accruedInterest,
    };
  }
}

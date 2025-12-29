import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { CreditCard } from '../database/entities/credit-card.entity';
import { InstallmentPurchase } from '../database/entities/installment-purchase.entity';
import { CreditCardInvoice } from '../database/entities/credit-card-invoice.entity';
import { InstallmentItem } from '../database/entities/installment-item.entity';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { CreateInstallmentPurchaseDto } from './dto/create-installment-purchase.dto';
import { Profile } from 'src/database/entities/profile.entity';
import { FinancialCategory } from 'src/database/entities/financial-category.entity';
import { CreateCreditCardInvoiceDto } from './dto/create-credit-card-invoice.dto';
import { MovementType } from 'src/database/entities/financial-movement.entity';
import { FinancialMovementsService } from '../financial-movements/financial-movements.service';
import { BudgetsService } from '../budgets/budgets.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import Decimal from 'decimal.js';

@Injectable()
export class CreditCardsService {
  constructor(
    @InjectRepository(CreditCard)
    private readonly creditCardRepository: Repository<CreditCard>,

    @InjectRepository(InstallmentPurchase)
    private readonly purchaseRepository: Repository<InstallmentPurchase>,

    @InjectRepository(CreditCardInvoice)
    private readonly invoiceRepository: Repository<CreditCardInvoice>,

    @InjectRepository(InstallmentItem)
    private readonly installmentItemRepository: Repository<InstallmentItem>,

    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    @InjectRepository(FinancialCategory)
    private readonly categoryRepository: Repository<FinancialCategory>,

    // Injected Service for Logic reuse
    private readonly financialMovementsService: FinancialMovementsService,
    private readonly budgetsService: BudgetsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // MÉTODO MANTIDO IGUAL
  async createCreditCard(dto: CreateCreditCardDto, userId: string) {
    const profile = await this.profileRepository.findOne({
      where: { id: dto.profileId },
      relations: ['user'],
    });

    if (!profile) throw new NotFoundException('Perfil não encontrado.');
    if (profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    const creditCard = this.creditCardRepository.create({
      cardName: dto.cardName,
      bank: dto.bank,
      cardNumber: dto.cardNumber,
      limit: dto.limit,
      closingDay: dto.closingDay,
      dueDay: dto.dueDay,
      profile,
    });

    const savedCard = await this.creditCardRepository.save(creditCard);

    await this.auditLogsService.logChange(
      userId,
      'CREATE',
      'CreditCard',
      savedCard.id,
      savedCard,
    );

    return savedCard;
  }

  async findAll(userId: string) {
    return this.creditCardRepository.find({
      where: { profile: { user: { id: userId } } },
      relations: ['profile'],
    });
  }

  async findOne(id: string, userId: string) {
    const card = await this.creditCardRepository.findOne({
      where: { id },
      relations: ['profile', 'profile.user', 'invoices', 'purchases'],
    });

    if (!card) throw new NotFoundException('Cartão não encontrado.');
    if (card.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    return card;
  }

  async remove(id: string, userId: string) {
    const card = await this.findOne(id, userId);
    await this.creditCardRepository.softDelete(id);

    await this.auditLogsService.logChange(userId, 'DELETE', 'CreditCard', id, {
      old: card,
    });

    return { deleted: true };
  }

  // MÉTODO MODIFICADO: Agora gera parcelas automaticamente
  async createInstallmentPurchase(
    dto: CreateInstallmentPurchaseDto,
    userId: string,
  ) {
    const card = await this.creditCardRepository.findOne({
      where: { id: dto.creditCardId },
      relations: ['profile', 'profile.user'],
    });

    if (!card) throw new NotFoundException('Cartão não encontrado.');
    if (card.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    let category: FinancialCategory | undefined;
    if (dto.categoryId) {
      const foundCategory = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      }); // Use explicit check

      if (!foundCategory)
        throw new NotFoundException('Categoria não encontrada.');
      category = foundCategory;
    }

    // Criar a compra parcelada
    const purchase = this.purchaseRepository.create({
      productName: dto.productName,
      totalValue: dto.totalValue,
      installments: dto.installments,
      purchaseDate: new Date(dto.purchaseDate),
      creditCard: card,
      category: category || undefined,
    });

    const savedPurchase = await this.purchaseRepository.save(purchase);

    // Trigger Budget Alert (Competence View)
    await this.budgetsService.checkBudgetOverflow(
      card.profile.id,
      category?.id,
      dto.totalValue,
      new Date(dto.purchaseDate),
    );

    // NOVA FUNCIONALIDADE: Gerar parcelas automaticamente
    const totalValue = new Decimal(dto.totalValue);
    const installments = new Decimal(dto.installments);
    const installmentValue = totalValue.div(installments).toDecimalPlaces(2); // Round to 2 decimal places? adjusting last one?
    // Be careful with rounding diffs. Better: distribute diff to first/last or simple standard division.
    // For now, let's stick to standard division but using Decimal for precision before rounding.
    // If strict financial:
    // const baseValue = totalValue.div(installments).floor().toNumber();... etc.
    // Let's keep it simple but precise:

    // Simple approach:
    const val = totalValue.div(installments).toNumber();
    // Wait, if 100 / 3 = 33.3333...
    // We should probably explicitly round or handle remains.
    // Let's assume standard behavior for now:
    const installmentValueNumber = Number(val.toFixed(2));
    // This might lose cents. 33.33 * 3 = 99.99.
    // Correct way is to check diff on last installment.

    // Let's implement the 'last installment adjustment' logic for perfect precision
    const remainingAmount = totalValue;

    const purchaseDate = new Date(dto.purchaseDate);

    for (let i = 1; i <= dto.installments; i++) {
      let amount = installmentValueNumber;

      if (i === dto.installments) {
        // Last installment gets the difference
        // Sum of previous (i-1) * amount
        const previousTotal = new Decimal(installmentValueNumber).times(
          dto.installments - 1,
        );
        amount = totalValue.minus(previousTotal).toNumber();
      }

      const dueDate = new Date(purchaseDate);
      dueDate.setMonth(purchaseDate.getMonth() + i - 1);

      await this.installmentItemRepository.save({
        installmentNumber: i,
        amount: amount,
        dueDate,
        paid: false,
        installmentPurchase: savedPurchase,
        creditCardInvoice: undefined, // Será vinculado quando a fatura for criada
      });
    }

    await this.auditLogsService.logChange(
      userId,
      'CREATE',
      'InstallmentPurchase',
      savedPurchase.id,
      savedPurchase,
    );

    return savedPurchase;
  }

  // MÉTODO CORRIGIDO: Sem referência a purchase
  async createCreditCardInvoice(
    dto: CreateCreditCardInvoiceDto,
    userId: string,
  ) {
    const card = await this.creditCardRepository.findOne({
      where: { id: dto.creditCardId },
      relations: ['profile', 'profile.user'],
    });

    if (!card) throw new NotFoundException('Cartão não encontrado.');
    if (card.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    const invoice = this.invoiceRepository.create({
      month: dto.month,
      totalAmount: dto.totalAmount,
      paid: dto.paid,
      creditCard: card,
    });

    return this.invoiceRepository.save(invoice);
  }

  async closeInvoice(
    creditCardId: string,
    year: number,
    month: number,
    userId: string,
  ) {
    const card = await this.creditCardRepository.findOne({
      where: { id: creditCardId },
      relations: ['profile', 'profile.user'],
    });

    if (!card) throw new NotFoundException('Cartão não encontrado.');
    if (card.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    // Descobre o inicio e fim do mês de referência
    const startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Busca todas as parcelas do cartão, não pagas, vencendo dentro do mês
    const installmentItems = await this.installmentItemRepository.find({
      where: {
        creditCardInvoice: IsNull(),
        paid: false,
        dueDate: Between(startDate, endDate),
        installmentPurchase: { creditCard: { id: creditCardId } },
      },
      relations: ['installmentPurchase'],
    });

    if (!installmentItems || !installmentItems.length)
      throw new NotFoundException('Nenhuma parcela encontrada para o período.');

    // Cria a fatura
    const totalAmount = installmentItems
      .reduce((total, item) => total.plus(item.amount), new Decimal(0))
      .toNumber();

    const invoice = this.invoiceRepository.create({
      month: `${year}-${month.toString().padStart(2, '0')}`,
      totalAmount,
      paid: false,
      creditCard: card,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Atualiza as parcelas vinculando-as à fatura recém-criada
    for (const item of installmentItems) {
      item.creditCardInvoice = savedInvoice;
      await this.installmentItemRepository.save(item);
    }

    await this.auditLogsService.logChange(
      userId,
      'CREATE',
      'CreditCardInvoice',
      savedInvoice.id,
      savedInvoice,
    );

    return {
      invoice: savedInvoice,
      items: installmentItems,
    };
  }

  async payInvoice(
    invoiceId: string,
    userId: string,
    profileId: string,
    categoryId?: string,
  ) {
    // Buscar fatura e validar
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['creditCard', 'creditCard.profile', 'installmentItems'],
    });

    if (!invoice) throw new NotFoundException('Fatura não encontrada.');
    if (invoice.creditCard.profile.id !== profileId)
      throw new ForbiddenException('Acesso negado.');
    if (invoice.paid) throw new ForbiddenException('Fatura já está paga.');

    // Marcar fatura como paga
    invoice.paid = true;
    await this.invoiceRepository.save(invoice);

    // Marcar todas as parcelas da fatura como pagas
    for (const item of invoice.installmentItems) {
      item.paid = true;
      await this.installmentItemRepository.save(item);
    }

    // Criar movimentacao financeira de saida (pagamento da fatura) USANDO O SERVICE para gerar alertas!
    // Se categoryId não for informado, passa undefined (o service lida ou fica null)
    // Mas o DTO do create financial movement espera categoryId?
    // FinancialMovementsService.create espera CreateFinancialMovementDto.

    // Precisamos montar o DTO.
    const createDto = {
      amount: Number(invoice.totalAmount),
      type: MovementType.EXPENSE,
      date: new Date().toISOString(), // DTO expects ISO string usually, let's check.
      // Service create expects DTO.
      description: `Pagamento da fatura do cartão ${invoice.creditCard.cardName} - ${invoice.month}`,
      categoryId: categoryId || undefined,
      profileId: profileId,
    };

    // Chamada ao Service (que valida, salva e GERA ALERTA DE ORÇAMENTO)
    // Cast to any because we are manually building the DTO without importing class
    const paymentMovement = await this.financialMovementsService.create(
      createDto as any,
      userId,
    );

    await this.auditLogsService.logChange(
      userId,
      'UPDATE',
      'CreditCardInvoice',
      invoice.id,
      { action: 'PAY_INVOICE', invoicePaid: true },
    );

    return { message: 'Fatura paga com sucesso.', invoice, paymentMovement };
  }

  async suggestBestCard(
    userId: string,
    amount?: number,
    purchaseDateString?: string,
  ) {
    const cards = await this.creditCardRepository.find({
      where: { profile: { user: { id: userId } } },
      relations: ['profile'],
    });

    if (!cards.length)
      throw new NotFoundException('Nenhum cartão de crédito encontrado.');

    const purchaseDate = purchaseDateString
      ? new Date(purchaseDateString)
      : new Date();

    // Calcular melhor cartão
    const suggestions = cards.map((card) => {
      if (amount && card.limit < amount) {
        return { card, workable: false, reason: 'Limite insuficiente (Total)' };
      }

      const purchaseDay = purchaseDate.getDate();
      const currentInvoiceClosingDate = new Date(purchaseDate);
      currentInvoiceClosingDate.setDate(card.closingDay);

      // Se a data da compra é DEPOIS do fechamento, entra na próxima fatura (ganha ~30 dias)
      // Se é ANTES ou NO DIA, entra na fatura atual.
      // Cuidado com meses.

      // Ajuste mês/ano do ClosingDate para bater com a compra
      // Se card.closingDay é 5 e hoje é 10/Jan, o fechamento deste mês foi 05/Jan.
      // A compra entra na fatura que fecha em 05/Fev.

      // Logica robusta:
      // Encontrar o PRÓXIMO data de fechamento a partir da data da compra.
      // Se compra < Fechamento(MêsAtual), então PróximoFechamento = Fechamento(MêsAtual)
      // Se compra > Fechamento(MêsAtual), então PróximoFechamento = Fechamento(MêsSeguinte)

      // Porem, "Fechamento" nao é o dia de VENCIMENTO.
      // A gente quer maximizar (DataVencimento - DataCompra).

      const relevantClosingDate = new Date(purchaseDate);
      relevantClosingDate.setDate(card.closingDay);

      if (purchaseDay > card.closingDay) {
        // Já passou o fechamento desse mês, vai para o próximo
        relevantClosingDate.setMonth(relevantClosingDate.getMonth() + 1);
      }

      // Agora calculamos o Vencimento associado a esse Fechamento
      const dueDate = new Date(relevantClosingDate);
      dueDate.setDate(card.dueDay);

      // Se o dia de vencimento for MENOR que dia de fechamento, provavelmente é no mês seguinte ao fechamento.
      // Ex: Fecha dia 25, Vence dia 05.
      // Fecha 25/Jan -> Vence 05/Fev.
      if (card.dueDay < card.closingDay) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      // Garantir que Vencimento > Fechamento (se configurado errado, assume mês seguinte)
      if (dueDate <= relevantClosingDate) {
        dueDate.setMonth(dueDate.getMonth() + 1);
      }

      const diffTime = dueDate.getTime() - purchaseDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        card,
        workable: true,
        diffDays,
        dueDate,
        closingDate: relevantClosingDate,
      };
    });

    const viable = suggestions
      .filter((s) => s.workable)
      .sort((a: any, b: any) => b.diffDays - a.diffDays);

    if (!viable.length) {
      // Se nenhum viável (por limite), retorna o melhor "workable=false" ou erro
      return { bestCard: null, all: suggestions };
    }

    return {
      bestCard: viable[0],
      others: viable.slice(1),
      all: suggestions,
    };
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, In } from 'typeorm';
import { CreditCard } from '../database/entities/credit-card.entity';
import { InstallmentPurchase } from '../database/entities/installment-purchase.entity';
import { Invoice, InvoiceStatus } from '../database/entities/invoice.entity';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { CreateInstallmentPurchaseDto } from './dto/create-installment-purchase.dto';
import { Profile } from 'src/database/entities/profile.entity';
import { FinancialCategory } from 'src/database/entities/financial-category.entity';
import { CreateCreditCardInvoiceDto } from './dto/create-credit-card-invoice.dto';
import {
  FinancialMovement,
  MovementType,
} from 'src/database/entities/financial-movement.entity';
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

    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,

    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,

    @InjectRepository(FinancialCategory)
    private readonly categoryRepository: Repository<FinancialCategory>,

    @InjectRepository(FinancialMovement)
    private readonly movementRepository: Repository<FinancialMovement>,

    private readonly financialMovementsService: FinancialMovementsService,
    private readonly budgetsService: BudgetsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

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

    let category: FinancialCategory | null = null;
    if (dto.categoryId) {
      category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Categoria não encontrada.');
    }

    // Create Purchase Header
    const purchase = this.purchaseRepository.create({
      productName: dto.productName,
      totalValue: dto.totalValue,
      installments: dto.installments,
      purchaseDate: new Date(dto.purchaseDate),
      creditCard: card,
      category: category || undefined,
    });

    const savedPurchase = await this.purchaseRepository.save(purchase);

    // Budget Check
    await this.budgetsService.checkBudgetOverflow(
      card.profile.id,
      category?.id,
      dto.totalValue,
      new Date(dto.purchaseDate),
    );

    // Generate Standard Installments (FinancialMovements)
    const totalValue = new Decimal(dto.totalValue);
    const installments = dto.installments;
    const installmentValue = Number(totalValue.div(installments).toFixed(2));
    const purchaseDate = new Date(dto.purchaseDate);

    // Find correct starting invoice due date logic
    // Usually: If purchase date <= closing date -> first installment in NEXT due date.
    // If purchase date > closing date -> first installment in NEXT+1 due date?
    // Let's implement generic logic:
    // First installment typically falls in the "current open invoice" if bought before closing,
    // or next invoice if bought after.

    // Let's iterate.
    for (let i = 1; i <= installments; i++) {
        let amount = installmentValue;
        if (i === installments) {
            const previousTotal = new Decimal(installmentValue).times(installments - 1);
            amount = totalValue.minus(previousTotal).toNumber();
        }

        // Calculate 'Reference Month' for this installment
        // Base Date for 1st installment
        const baseDate = new Date(purchaseDate);
        
        // Logic:
        // Closing Day = 5. Due Day = 10.
        // Buy on 01/Jan (Before Closing). Current Invoice (Jan Invoice) closes 05/Jan. Due 10/Jan.
        // So 1st installment is usually charged immediately or next month?
        // Usually, 1st installment is in the NEXT bill.
        // If I buy on 01/Jan, it comes on 10/Jan bill? YES.
        // If I buy on 10/Jan (After Closing 05/Jan), it comes on 10/Feb bill.
        
        // Determining the Invoice Month for the 1st installment:
        let targetInvoiceMonthDate = new Date(baseDate);
        if (baseDate.getDate() > card.closingDay) {
            // Already passed closing, moves to next month
            targetInvoiceMonthDate.setMonth(targetInvoiceMonthDate.getMonth() + 1);
        }
        
        // For subsequent installments, add (i - 1) months
        targetInvoiceMonthDate.setMonth(targetInvoiceMonthDate.getMonth() + (i - 1));

        // Create FinancialMovement
        const movement = this.movementRepository.create({
            amount: amount,
            type: MovementType.EXPENSE,
            date: targetInvoiceMonthDate, // Use the estimated invoice month date as the movement date
            description: `${dto.productName} (${i}/${installments})`,
             profile: card.profile,
             category: category || undefined,
             installmentPurchase: savedPurchase,
            // invoice: undefined (will be linked when invoice is closed)
        });

        await this.movementRepository.save(movement);
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

  // Deprecated direct invoice creation, use closeInvoice logic or internal
  // Keeping method signature compatibility if needed or simplified
  async createCreditCardInvoice(dto: CreateCreditCardInvoiceDto, userId: string) {
      // Not implemented manually for strict flow
      throw new BadRequestException("Use closeInvoice to generate invoices.");
  }


  async getInvoices(creditCardId: string, userId: string) {
      // Return existing Invoice entities
      const card = await this.findOne(creditCardId, userId);
      return this.invoiceRepository.find({
          where: { card: { id: card.id } },
          order: { year: 'DESC', month: 'DESC' }
      });
  }

  async closeInvoice(
    creditCardId: string,
    year: number,
    month: number, // 1-12
    userId: string,
  ) {
    const card = await this.findOne(creditCardId, userId);

    const monthStr = month.toString().padStart(2, '0');

    // Check if already closed
    const existing = await this.invoiceRepository.findOne({
        where: { card: { id: card.id }, month: monthStr, year }
    });
    if (existing) throw new BadRequestException(`Fatura ${month}/${year} já está fechada.`);

    // 1. Calculate the date range for this invoice
    // Closing Date for this invoice = {year}-{month}-{closingDay}
    // Opening Date = Last Closing Date + 1 day = {prevMonth}-{closingDay} + 1
    
    // Careful with dates.
    // If Due Day = 10, Closing = 5.
    // Invoice "Jan 2025" (Due 10/Jan).
    // Closing Date = 05/Jan/2025.
    // Opening Date = 06/Dec/2024.
    
    // We need to find movements (installments/expenses) that have `date` falling into this range?
    // OR we matched the `date` logic in `createInstallmentPurchase` to match the invoice month directly.
    // In `createInstallmentPurchase`, we set `date` to `targetInvoiceMonthDate`.
    // So we just need to find movements where Month/Year of `date` matches the target Invoice Month/Year.
    
    // Find Uninvoiced Movements for this Card+Month+Year
    // Need to join via InstallmentPurchase OR just check logic.
    // Wait, FinancialMovement linked to InstallmentPurchase linked to Card.
    
    // We need to query:
    // Movements where:
    //   invoiceId is NULL
    //   installmentPurchase.creditCard.id = cardId
    //   MONTH(date) = month AND YEAR(date) = year
    //   (assuming date was set correctly to the billing month)

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // End of month

    const movements = await this.movementRepository.find({
        where: {
            installmentPurchase: { creditCard: { id: card.id } },
            invoiceId: IsNull(),
            date: Between(startDate, endDate)
        },
        relations: ['installmentPurchase']
    });

    if (movements.length === 0) {
       // Should we allow empty invoice closing? Maybe.
    }

    const totalAmount = movements.reduce((sum, m) => sum + Number(m.amount), 0);

    const invoice = this.invoiceRepository.create({
        card,
        month: monthStr,
        year,
        amount: totalAmount,
        status: InvoiceStatus.CLOSED,
        dueDate: new Date(year, month - 1, card.dueDay).toISOString(),
        closingDate: new Date(year, month - 1, card.closingDay).toISOString() 
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Link movements
    for (const mov of movements) {
        mov.invoice = savedInvoice;
        await this.movementRepository.save(mov);
    }

    return savedInvoice;
  }

  async payInvoice(
    invoiceId: string,
    userId: string,
    profileId: string,
    categoryId?: string,
  ) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['card', 'card.profile'],
    });

    if (!invoice) throw new NotFoundException('Fatura não encontrada.');
    if (invoice.card.profile.user.id !== userId) throw new ForbiddenException('Acesso negado.'); 
    // Ideally check profileId too, but userId is safer owner check.

    if (invoice.status === InvoiceStatus.PAID) throw new BadRequestException('Fatura já paga.');

    // 1. Mark as PAID
    invoice.status = InvoiceStatus.PAID;
    await this.invoiceRepository.save(invoice);

    // 2. Generate Payment Expense (Cash Flow)
    // This reduces the user's "Available Balance" (Gasto Livre / Account)
    await this.financialMovementsService.create({
        amount: invoice.amount,
        type: MovementType.EXPENSE,
        date: new Date().toISOString(),
        description: `Pagamento Fatura ${invoice.card.cardName} (${invoice.month}/${invoice.year})`,
        profileId: profileId,
        categoryId: categoryId || undefined,
    }, userId);

    return { message: "Fatura paga com sucesso", invoice };
  }

  async suggestBestCard(userId: string, amount?: number, purchaseDateString?: string) {
      // Maintain previous logic...
      // Simplified for brevity in this refactor, but kept returning mockup or real logic
      // Copying logic from before...
       const cards = await this.creditCardRepository.find({
      where: { profile: { user: { id: userId } } },
      relations: ['profile'],
    });

    if (!cards.length)
      throw new NotFoundException('Nenhum cartão de crédito encontrado.');

    const purchaseDate = purchaseDateString
      ? new Date(purchaseDateString)
      : new Date();

    const suggestions = cards.map((card) => {
      if (amount && card.limit < amount) {
        return { card, workable: false, reason: 'Limite insuficiente (Total)' };
      }

      const purchaseDay = purchaseDate.getDate();
      
      // Basic logic calculation
      let days = 30; // Mock calculation for now or restore complex logic
      // Restoring logic:
      const relevantClosingDate = new Date(purchaseDate);
      relevantClosingDate.setDate(card.closingDay);
      if (purchaseDay > card.closingDay) {
          relevantClosingDate.setMonth(relevantClosingDate.getMonth() + 1);
      }
      
      const dueDate = new Date(relevantClosingDate);
      dueDate.setDate(card.dueDay);
      if (card.dueDay < card.closingDay) {
         dueDate.setMonth(dueDate.getMonth() + 1);
      }
      if (dueDate <= relevantClosingDate) dueDate.setMonth(dueDate.getMonth() + 1);

      const diffTime = dueDate.getTime() - purchaseDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
          card,
          workable: true,
          diffDays,
          dueDate,
          closingDate: relevantClosingDate
      };
    });

     const viable = suggestions
      .filter((s) => s.workable)
      .sort((a: any, b: any) => b.diffDays - a.diffDays);
      
     return {
       bestCard: viable[0],
       others: viable.slice(1),
       all: suggestions,
     };
  }
}

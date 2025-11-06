import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { CreditCard } from '../database/entities/credit-card.entity';
import { InstallmentPurchase } from '../database/entities/installment-purchase.entity';
import { CreditCardInvoice } from '../database/entities/credit-card-invoice.entity';
import { InstallmentItem } from '../database/entities/installment-item.entity'; 
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { CreateInstallmentPurchaseDto } from './dto/create-installment-purchase.dto';
import { Profile } from 'src/database/entities/profile.entity';
import { CreateCreditCardInvoiceDto } from './dto/create-credit-card-invoice.dto';
import { FinancialMovement, MovementType } from 'src/database/entities/financial-movement.entity';
//import { addMonths, format } from 'date-fns';

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

    @InjectRepository(FinancialMovement)
    private readonly financialMovementRepository: Repository<FinancialMovement>,

    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>
  ) {}

  // MÉTODO MANTIDO IGUAL
  async createCreditCard(dto: CreateCreditCardDto, userId: string) {
    const profile = await this.profileRepository.findOne({
      where: { id: dto.profileId },
      relations: ['user']
    });

    if (!profile) throw new NotFoundException('Perfil não encontrado.');
    if (profile.user.id !== userId) throw new ForbiddenException('Acesso negado.');

    const creditCard = this.creditCardRepository.create({
      cardName: dto.cardName,
      bank: dto.bank,
      cardNumber: dto.cardNumber,
      limit: dto.limit,
      profile
    });

    return this.creditCardRepository.save(creditCard);
  }

  // MÉTODO MODIFICADO: Agora gera parcelas automaticamente
  async createInstallmentPurchase(dto: CreateInstallmentPurchaseDto, userId: string) {
    const card = await this.creditCardRepository.findOne({
      where: { id: dto.creditCardId },
      relations: ['profile', 'profile.user']
    });

    if (!card) throw new NotFoundException('Cartão não encontrado.');
    if (card.profile.user.id !== userId) throw new ForbiddenException('Acesso negado.');

    // Criar a compra parcelada
    const purchase = this.purchaseRepository.create({
      productName: dto.productName,
      totalValue: dto.totalValue,
      installments: dto.installments,
      purchaseDate: new Date(dto.purchaseDate),
      creditCard: card
    });

    const savedPurchase = await this.purchaseRepository.save(purchase);

    // NOVA FUNCIONALIDADE: Gerar parcelas automaticamente
    const installmentValue = dto.totalValue / dto.installments;
    const purchaseDate = new Date(dto.purchaseDate);

    for (let i = 1; i <= dto.installments; i++) {
      const dueDate = new Date(purchaseDate);
      dueDate.setMonth(purchaseDate.getMonth() + i - 1);

      await this.installmentItemRepository.save({
        installmentNumber: i,
        amount: installmentValue,
        dueDate,
        paid: false,
        installmentPurchase: savedPurchase,
        creditCardInvoice: undefined // Será vinculado quando a fatura for criada
      });
    }

    return savedPurchase;
  }

  // MÉTODO CORRIGIDO: Sem referência a purchase
  async createCreditCardInvoice(dto: CreateCreditCardInvoiceDto, userId: string) {
    const card = await this.creditCardRepository.findOne({
      where: { id: dto.creditCardId },
      relations: ['profile', 'profile.user'],
    });

    if (!card) throw new NotFoundException('Cartão não encontrado.');
    if (card.profile.user.id !== userId) throw new ForbiddenException('Acesso negado.');

    const invoice = this.invoiceRepository.create({
      month: dto.month,
      totalAmount: dto.totalAmount,
      paid: dto.paid,
      creditCard: card,
    });
    
    return this.invoiceRepository.save(invoice);
  }

  async closeInvoice(creditCardId: string, year: number, month: number, userId: string) {
    const card = await this.creditCardRepository.findOne({
      where: { id: creditCardId },
      relations: ['profile', 'profile.user']
    });

    if (!card) throw new NotFoundException('Cartão não encontrado.');
    if (card.profile.user.id !== userId) throw new ForbiddenException('Acesso negado.');

    // Descobre o inicio e fim do mês de referência
    const startDate = new Date(year, month -1, 1, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Busca todas as parcelas do cartão, não pagas, vencendo dentro do mês
    const installmentItems = await this.installmentItemRepository.find({
      where: {
        creditCardInvoice: IsNull(),
        paid: false,
        dueDate: Between(startDate, endDate),
        installmentPurchase: { creditCard: { id: creditCardId } }
      },
      relations: ['installmentPurchase'],
    });

    if (!installmentItems || !installmentItems.length) throw new NotFoundException('Nenhuma parcela encontrada para o período.');

    // Cria a fatura
    const invoice = this.invoiceRepository.create({
      month: `${year}-${month.toString().padStart(2, '0')}`,
      totalAmount: installmentItems.reduce((total, item) => total + Number(item.amount), 0),
      paid: false,
      creditCard: card
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    // Atualiza as parcelas vinculando-as à fatura recém-criada
    for (const item of installmentItems) {
      item.creditCardInvoice = savedInvoice;
      await this.installmentItemRepository.save(item);
    }

    return {
      invoice: savedInvoice,
      items: installmentItems
    }
  }

  async payInvoice(invoiceId: string, userId: string, profileId: string) {
    // Buscar fatura e validar
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['creditCard', 'creditCard.profile', 'installmentItems']
    });

    if (!invoice) throw new NotFoundException('Fatura não encontrada.');
    if (invoice.creditCard.profile.id !== profileId) throw new ForbiddenException('Acesso negado.');
    if (invoice.paid) throw new ForbiddenException('Fatura já está paga.');

    // Marcar fatura como paga
    invoice.paid = true;
    await this.invoiceRepository.save(invoice);

    // Marcar todas as parcelas da fatura como pagas
    // TODO: verficar se ha maneira mais performatica de fazer isto
    //       para nao ser necessario tantas chamadas ao banco dentro do loop
    for (const item of invoice.installmentItems) {
      item.paid = true;
      await this.installmentItemRepository.save(item);
    }

    // Criar movimentacao financeira de saida (pagamento da fatura)
    const paymentMovement = this.financialMovementRepository.create({
      amount: invoice.totalAmount,
      type: MovementType.EXPENSE,
      description: `Pagamento da fatura do cartão ${invoice.creditCard.cardName} - ${invoice.month}`,
      date: new Date(),
      profile: invoice.creditCard.profile,
    });

    await this.financialMovementRepository.save(paymentMovement);

    return { message: 'Fatura paga com sucesso.', invoice, paymentMovement };
  }
}
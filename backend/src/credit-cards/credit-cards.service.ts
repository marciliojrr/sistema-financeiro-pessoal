import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditCard } from '../database/entities/credit-card.entity';
import { InstallmentPurchase } from '../database/entities/installment-purchase.entity';
import { CreditCardInvoice } from '../database/entities/credit-card-invoice.entity';
import { InstallmentItem } from '../database/entities/installment-item.entity'; // ADICIONAR
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { CreateInstallmentPurchaseDto } from './dto/create-installment-purchase.dto';
import { Profile } from 'src/database/entities/profile.entity';
import { CreateCreditCardInvoiceDto } from './dto/create-credit-card-invoice.dto';

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
}

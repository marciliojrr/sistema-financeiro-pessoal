import { Controller, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { CloseCreditCardInvoiceDto } from './dto/close-credit-card-invoice.dto';
import { CreateInstallmentPurchaseDto } from './dto/create-installment-purchase.dto';
import { PayCreditCardInvoiceDto } from './dto/pay-credit-card-invoice.dto';

@ApiTags('credit-cards')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('credit-cards')
export class CreditCardController {
    constructor(private readonly creditCardsService: CreditCardsService) {}

    @Post()
    createCreditCard(@Body() dto: CreateCreditCardDto, @Req() req) {
        return this.creditCardsService.createCreditCard(dto, req.user.userId);
    }

    @Post(':cardId/invoices/close')
    async closeInvoice(
        @Param('cardId') cardId: string,
        @Body() dto: CloseCreditCardInvoiceDto,
        @Req() req
    ) {
        return this.creditCardsService.closeInvoice(cardId, dto.year, dto.month, req.user.userId);
    }

    @Post('installment-purchases')
    createInstallmentPurchase(@Body() dto: CreateInstallmentPurchaseDto, @Req() req) {
        return this.creditCardsService.createInstallmentPurchase(dto, req.user.userId);
    }

    @Post('invoices/:invoiceId/pay')
    payInvoice(
        @Param('invoiceId') invoiceId: string,
        @Body() dto: PayCreditCardInvoiceDto,
        @Req() req
    ) {
        return this.creditCardsService.payInvoice(invoiceId, req.user.userId, dto.profileId);
    }
}
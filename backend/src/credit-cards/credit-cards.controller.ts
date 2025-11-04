import { Controller, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';
import { CloseCreditCardInvoiceDto } from './dto/close-credit-card-invoice.dto';

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
}
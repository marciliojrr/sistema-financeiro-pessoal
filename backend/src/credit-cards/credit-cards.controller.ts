import { Controller, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';

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
        @Body('year') year: number,
        @Body('month') month: number,
        @Req() req
    ) {
        return this.creditCardsService.closeInvoice(cardId, year, month, req.user.userId);
    }   
}
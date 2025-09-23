import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreditCardsService } from './credit-cards.service';
import { CreateCreditCardDto } from './dto/create-credit-card.dto';

@ApiTags('credit-cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credit-cards')
export class CreditCardController {
    constructor(private readonly creditCardsService: CreditCardsService) {}

    @Post()
    createCreditCard(@Body() dto: CreateCreditCardDto, @Req() req) {
        return this.creditCardsService.createCreditCard(dto, req.user.id);
    }

    // Implementar endpoints similares para compras parceladas e faturas
}
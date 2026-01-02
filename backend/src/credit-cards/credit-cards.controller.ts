import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Param,
  Get,
  Query,
  Delete,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
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

  @Get('recommendation')
  @ApiOperation({ summary: 'Sugere o melhor cartão para uma compra' })
  @ApiQuery({ name: 'amount', required: false, type: Number })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Data da compra (YYYY-MM-DD)',
  })
  getRecommendation(
    @Req() req,
    @Query('amount') amount?: number,
    @Query('date') date?: string,
  ) {
    return this.creditCardsService.suggestBestCard(
      req.user.userId,
      amount,
      date,
    );
  }

  @Post()
  createCreditCard(@Body() dto: CreateCreditCardDto, @Req() req) {
    return this.creditCardsService.createCreditCard(dto, req.user.userId);
  }

  @Get()
  findAll(@Req() req) {
    return this.creditCardsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.creditCardsService.findOne(id, req.user.userId);
  }

  @Get(':id/invoices')
  @ApiOperation({ summary: 'Lista faturas de um cartão' })
  getInvoices(@Param('id') id: string, @Req() req) {
    return this.creditCardsService.getInvoices(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.creditCardsService.remove(id, req.user.userId);
  }

  @Post(':cardId/invoices/close')
  async closeInvoice(
    @Param('cardId') cardId: string,
    @Body() dto: CloseCreditCardInvoiceDto,
    @Req() req,
  ) {
    return this.creditCardsService.closeInvoice(
      cardId,
      dto.year,
      dto.month,
      req.user.userId,
    );
  }

  @Post('installment-purchases')
  createInstallmentPurchase(
    @Body() dto: CreateInstallmentPurchaseDto,
    @Req() req,
  ) {
    return this.creditCardsService.createInstallmentPurchase(
      dto,
      req.user.userId,
    );
  }

  @Post('invoices/:invoiceId/pay')
  payInvoice(
    @Param('invoiceId') invoiceId: string,
    @Body() dto: PayCreditCardInvoiceDto,
    @Req() req,
  ) {
    return this.creditCardsService.payInvoice(
      invoiceId,
      req.user.userId,
      dto.profileId,
      dto.categoryId,
    );
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator';

export class CreateCreditCardInvoiceDto {
    @ApiProperty( { example: '2025-09', description: 'Mês da fatura no formato YYYY-MM' } )
    @IsString()
    month: string;

    @ApiProperty( { example: 1500.75, description: 'Valor total da fatura' } )
    @IsNumber()
    totalAmount: number;

    @ApiProperty( { example: false, description: 'Indica se a fatura foi paga' } )
    @IsBoolean()
    paid: boolean;

    @ApiProperty( { example: 'uuid-do-cartao-de-credito', description: 'ID do cartão de crédito associado à fatura' } )
    @IsUUID()
    creditCardId: string;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsDateString, IsUUID, Min } from 'class-validator';

export class CreateInstallmentPurchaseDto {
    @ApiProperty({ example: 'Lava louças Samsung 15 serviços', description: 'Nome do produto comprado' })
    @IsString()
    productName: string;

    @ApiProperty({ example: 2500.00, description: 'Valor total da compra' })
    @IsNumber()
    totalValue: number;

    @ApiProperty({ example: 10, description: 'Número de parcelas' })
    @IsNumber()
    @Min(1)
    installments: number;

    @ApiProperty({ example: '2023-10-15', description: 'Data da compra' })
    @IsDateString()
    purchaseDate: Date;

    @ApiProperty({ example: 'uuid-do-cartao-de-credito' })
    @IsUUID()
    creditCardId: string;
}
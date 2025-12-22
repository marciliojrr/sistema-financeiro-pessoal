import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, IsCreditCard } from 'class-validator';

export class CreateCreditCardDto {
  @ApiProperty({
    example: 'Visa Platinum',
    description: 'Nome do cartão de crédito',
  })
  @IsString()
  cardName: string;

  @ApiProperty({
    example: 'Banco Bradesco',
    description: 'Nome do banco emissor do cartão',
  })
  @IsString()
  bank: string;

  @ApiProperty({
    example: '1234-5678-9012-3456',
    description: 'Número do cartão de crédito',
  })
  @IsString()
  @IsCreditCard()
  cardNumber: string;

  @ApiProperty({ example: 5000.0, description: 'Limite do cartão de crédito' })
  @IsNumber()
  limit: number;

  @ApiProperty({ example: 1, description: 'Dia de fechamento da fatura' })
  @IsNumber()
  closingDay: number;

  @ApiProperty({ example: 10, description: 'Dia de vencimento da fatura' })
  @IsNumber()
  dueDay: number;

  @ApiProperty({
    example: 'uuid-do-perfil',
    description: 'ID do perfil associado ao cartão de crédito',
  })
  @IsUUID()
  profileId: string;
}

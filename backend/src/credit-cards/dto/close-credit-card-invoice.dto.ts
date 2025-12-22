import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

export class CloseCreditCardInvoiceDto {
  @ApiProperty({ example: 2025, description: 'Ano da fatura a encerrar' })
  @IsInt()
  @Min(2000)
  year: number;

  @ApiProperty({ example: 9, description: 'Mês da fatura (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

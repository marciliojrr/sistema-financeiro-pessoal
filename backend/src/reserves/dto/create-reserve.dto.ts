import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsHexColor,
  IsUUID,
} from 'class-validator';

export class CreateReserveDto {
  @ApiProperty({ description: 'ID do perfil' })
  @IsUUID()
  @IsNotEmpty()
  profileId: string;

  @ApiProperty({ description: 'Nome da reserva/meta' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Valor meta' })
  @IsNumber()
  @IsNotEmpty()
  targetAmount: number;

  @ApiProperty({
    description: 'Valor atual (inicial)',
    required: false,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  currentAmount?: number;

  @ApiProperty({
    description: 'Data alvo para atingir a meta',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @ApiProperty({ description: 'Descrição da reserva', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Cor para exibição (HEX)', default: '#000000' })
  @IsHexColor()
  @IsOptional()
  color?: string;
}

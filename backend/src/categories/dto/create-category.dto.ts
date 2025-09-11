import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Despesa Fixa', description: 'Nome da categoria financeira' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'despesa fixa', description: 'Tipo da categoria: despesa fixa, variável, etc.' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ example: true, description: 'Categoria está ativa?' })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiProperty({ example: 'uuid-do-perfil', description: 'ID do perfil financeiro' })
  @IsNotEmpty()
  @IsString()
  profileId: string;
}

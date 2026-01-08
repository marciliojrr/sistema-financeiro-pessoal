import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { IncomeSource, CategoryType } from '../../database/entities/financial-category.entity';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Despesa Fixa',
    description: 'Nome da categoria financeira',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    enum: CategoryType,
    example: CategoryType.EXPENSE,
    description: 'Tipo da categoria: INCOME ou EXPENSE',
  })
  @IsNotEmpty()
  @IsEnum(CategoryType)
  type: CategoryType;

  @ApiProperty({ example: true, description: 'Categoria está ativa?' })
  @IsOptional()
  @IsBoolean()
  active?: boolean = true;

  @ApiProperty({
    example: 'uuid-do-perfil',
    description: 'ID do perfil financeiro',
  })
  @IsNotEmpty()
  @IsString()
  profileId: string;

  @ApiProperty({
    description: 'Indica se a categoria é para despesas/receitas fixas',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isFixed?: boolean;

  @ApiProperty({
    enum: IncomeSource,
    description: 'Fonte de renda (apenas para categorias de receita)',
    required: false,
  })
  @IsOptional()
  @IsEnum(IncomeSource)
  incomeSource?: IncomeSource;
}

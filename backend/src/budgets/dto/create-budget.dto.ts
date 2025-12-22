import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  Max,
  IsInt,
} from 'class-validator';

export class CreateBudgetDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsNotEmpty()
  @IsInt()
  @Min(2000)
  year: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsNotEmpty()
  @IsUUID()
  profileId: string;
}

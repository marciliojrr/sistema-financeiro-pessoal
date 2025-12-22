import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScenarioDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  profileId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  baseDate?: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  cloneRealData?: boolean;
}

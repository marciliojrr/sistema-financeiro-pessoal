import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'Marcílio Júnior',
    description: 'Nome completo do usuário',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'avataaars:Marcilio',
    description: 'URL ou identificador do avatar',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    example: 'marcilio@email.com',
    description: 'E-mail único do usuário',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'marcilio123',
    description: 'Senha com pelo menos 6 caracteres',
    minLength: 6,
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

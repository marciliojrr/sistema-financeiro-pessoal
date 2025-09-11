import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateProfileDto {
    @ApiProperty({ example: 'Pessoal', description: 'Nome do perfil financeiro' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: true, description: 'Perfil está ativo?' })
    @IsOptional()
    @IsBoolean()
    active?: boolean = true;

    @ApiProperty({ example: 'uuid-do-usuario', description: 'ID do usuário (relacionamento)' })
    @IsNotEmpty()
    @IsString()
    userId: string;
}
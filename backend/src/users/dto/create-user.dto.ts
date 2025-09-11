import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateUserDto {

    @ApiProperty({
    example: 'João da Silva',
    description: 'Nome completo do usuário',
    })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({
    example: 'joao@email.com',
    description: 'E-mail único do usuário',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
    example: 'senhaSegura123',
    description: 'Senha com pelo menos 6 caracteres',
    minLength: 6,
    })
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}

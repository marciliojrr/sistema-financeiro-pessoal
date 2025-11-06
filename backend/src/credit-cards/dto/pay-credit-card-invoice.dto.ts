import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class PayCreditCardInvoiceDto {
    @ApiProperty({
        description: "ID do perfil do usuário",
        example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6",
    })
    @IsUUID()
    profileId: string;
}
import { PartialType } from '@nestjs/swagger';
import { CreateReserveDto } from './create-reserve.dto';

export class UpdateReserveDto extends PartialType(CreateReserveDto) {}

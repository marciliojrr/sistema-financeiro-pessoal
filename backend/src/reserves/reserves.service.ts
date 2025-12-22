import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserve } from '../database/entities/reserve.entity';
import { CreateReserveDto } from './dto/create-reserve.dto';
import { UpdateReserveDto } from './dto/update-reserve.dto';
import { Profile } from '../database/entities/profile.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class ReservesService {
  constructor(
    @InjectRepository(Reserve)
    private readonly reserveRepository: Repository<Reserve>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    userId: string,
    createReserveDto: CreateReserveDto,
  ): Promise<Reserve> {
    const profile = await this.profileRepository.findOne({
      where: { id: createReserveDto.profileId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    if (profile.user.id !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para criar reservas neste perfil.',
      );
    }

    const reserve = this.reserveRepository.create({
      ...createReserveDto,
      profile,
    });

    const savedReserve = await this.reserveRepository.save(reserve);

    await this.auditLogsService.logChange(
      userId,
      'CREATE',
      'Reserve',
      savedReserve.id,
      savedReserve,
    );

    return savedReserve;
  }

  async findAll(userId: string, profileId?: string): Promise<Reserve[]> {
    const query = this.reserveRepository
      .createQueryBuilder('reserve')
      .leftJoinAndSelect('reserve.profile', 'profile')
      .leftJoin('profile.user', 'user')
      .where('user.id = :userId', { userId });

    if (profileId) {
      query.andWhere('profile.id = :profileId', { profileId });
    }

    return query.orderBy('reserve.createdAt', 'ASC').getMany();
  }

  async findOne(id: string, userId: string): Promise<Reserve> {
    const reserve = await this.reserveRepository.findOne({
      where: { id },
      relations: ['profile', 'profile.user'],
    });

    if (!reserve) throw new NotFoundException('Reserva não encontrada.');
    if (reserve.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    return reserve;
  }

  async update(
    id: string,
    userId: string,
    updateReserveDto: UpdateReserveDto,
  ): Promise<Reserve> {
    const reserve = await this.findOne(id, userId);

    const oldReserve = { ...reserve };

    this.reserveRepository.merge(reserve, updateReserveDto);
    const savedReserve = await this.reserveRepository.save(reserve);

    await this.auditLogsService.logChange(
      userId,
      'UPDATE',
      'Reserve',
      savedReserve.id,
      { old: oldReserve, new: savedReserve },
    );

    return savedReserve;
  }

  async remove(id: string, userId: string): Promise<void> {
    const reserve = await this.findOne(id, userId);
    await this.reserveRepository.softDelete(id);

    await this.auditLogsService.logChange(userId, 'DELETE', 'Reserve', id, {
      old: reserve,
    });
  }
}

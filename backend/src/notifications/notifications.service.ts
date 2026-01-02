import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../database/entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Profile } from '../database/entities/profile.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async create(data: CreateNotificationDto) {
    const profile = await this.profileRepository.findOne({
      where: { id: data.profileId },
    });
    if (!profile) throw new NotFoundException('Perfil não encontrado.');

    const notification = this.notificationRepository.create({
      ...data,
      profile,
    });

    return this.notificationRepository.save(notification);
  }

  async findAll(userId: string, filters: { read?: string }) {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.profile', 'profile')
      .leftJoin('profile.user', 'user')
      .where('user.id = :userId', { userId });

    if (filters.read !== undefined) {
      const isRead = filters.read === 'true';
      query.andWhere('notification.read = :isRead', { isRead });
    }

    return query.orderBy('notification.createdAt', 'DESC').getMany();
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['profile', 'profile.user'],
    });

    if (!notification)
      throw new NotFoundException('Notificação não encontrada.');
    if (notification.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    notification.read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    // More efficient update
    const profiles = await this.profileRepository.find({
      where: { user: { id: userId } },
      relations: ['notifications'],
    });

    const notificationIds: string[] = [];
    profiles.forEach((p) => {
      p.notifications.forEach((n) => {
        if (!n.read) notificationIds.push(n.id);
      });
    });

    if (notificationIds.length > 0) {
      await this.notificationRepository.update(notificationIds, { read: true });
    }

    return { message: 'Todas as notificações marcadas como lidas.' };
  }

  async update(id: string, userId: string, dto: UpdateNotificationDto) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['profile', 'profile.user'],
    });

    if (!notification)
      throw new NotFoundException('Notificação não encontrada.');
    if (notification.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    Object.assign(notification, dto);
    return this.notificationRepository.save(notification);
  }

  async delete(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['profile', 'profile.user'],
    });

    if (!notification)
      throw new NotFoundException('Notificação não encontrada.');
    if (notification.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    await this.notificationRepository.remove(notification);
    return { message: 'Notificação excluída com sucesso.' };
  }
}

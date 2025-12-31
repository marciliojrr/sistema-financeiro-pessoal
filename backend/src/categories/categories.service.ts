import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FinancialCategory } from 'src/database/entities/financial-category.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(FinancialCategory)
    private categoryRepository: Repository<FinancialCategory>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async createCategory(data: CreateCategoryDto, userId: string) {
    const category = this.categoryRepository.create({
        ...data,
        profile: { id: data.profileId }
    });
    const savedCategory = await this.categoryRepository.save(category);

    await this.auditLogsService.logChange(
      userId,
      'CREATE',
      'FinancialCategory',
      savedCategory.id,
      savedCategory,
    );

    return savedCategory;
  }

  findAll(userId: string) {
    return this.categoryRepository.find({
      where: { profile: { user: { id: userId } } },
      relations: ['profile'],
    });
  }

  findByProfile(profileId: string) {
    return this.categoryRepository.find({
      where: { profile: { id: profileId } },
    });
  }

  findOne(id: string) {
    return this.categoryRepository.findOne({
      where: { id },
      relations: ['profile', 'profile.user'],
    });
  }

  async remove(id: string, userId: string) {
    const category = await this.findOne(id);
    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    await this.categoryRepository.softDelete(id);

    await this.auditLogsService.logChange(
      userId,
      'DELETE',
      'FinancialCategory',
      id,
      { old: category },
    );

    return { deleted: true };
  }
}

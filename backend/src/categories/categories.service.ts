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

  async updateCategory(id: string, data: Partial<CreateCategoryDto>, userId: string) {
    const category = await this.findOne(id);
    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    Object.assign(category, data);
    const updatedCategory = await this.categoryRepository.save(category);

    await this.auditLogsService.logChange(
      userId,
      'UPDATE',
      'FinancialCategory',
      id,
      { old: category, new: updatedCategory },
    );

    return updatedCategory;
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

  async updateKeywords(id: string, keywords: string, userId: string) {
    const category = await this.findOne(id);
    if (!category) {
      throw new NotFoundException('Categoria não encontrada.');
    }

    category.keywords = keywords;
    const updated = await this.categoryRepository.save(category);

    await this.auditLogsService.logChange(
      userId,
      'UPDATE',
      'FinancialCategory',
      id,
      { keywords },
    );

    return updated;
  }

  async suggestCategory(description: string, profileId: string): Promise<FinancialCategory | null> {
    if (!description || description.length < 3) {
      return null;
    }

    const categories = await this.categoryRepository.find({
      where: { profile: { id: profileId }, active: true },
    });

    const descLower = description.toLowerCase();
    
    // First, check keywords
    for (const category of categories) {
      if (category.keywords) {
        const keywords = category.keywords.toLowerCase().split(',').map(k => k.trim());
        for (const keyword of keywords) {
          if (keyword && descLower.includes(keyword)) {
            return category;
          }
        }
      }
    }

    // Then, check category name
    for (const category of categories) {
      if (descLower.includes(category.name.toLowerCase())) {
        return category;
      }
    }

    // Common patterns for Brazilian expenses
    const patterns: { pattern: RegExp; categoryNames: string[] }[] = [
      { pattern: /luz|energia|enel|cemig|cpfl/i, categoryNames: ['energia', 'luz', 'despesas fixas'] },
      { pattern: /água|saneamento|copasa|sabesp/i, categoryNames: ['água', 'despesas fixas'] },
      { pattern: /internet|wifi|fibra|net|claro|vivo|tim|oi/i, categoryNames: ['internet', 'telefone', 'despesas fixas'] },
      { pattern: /aluguel|condomínio|condominio|iptu/i, categoryNames: ['moradia', 'aluguel', 'despesas fixas'] },
      { pattern: /mercado|supermercado|feira|açougue|padaria/i, categoryNames: ['alimentação', 'mercado', 'despesas variáveis'] },
      { pattern: /gasolina|combustível|combustivel|posto|etanol/i, categoryNames: ['combustível', 'transporte'] },
      { pattern: /uber|99|taxi|táxi|transporte/i, categoryNames: ['transporte', 'uber'] },
      { pattern: /salário|salario|pagamento|freelance|pix recebido/i, categoryNames: ['salário', 'renda', 'ganhos fixos'] },
      { pattern: /farmácia|farmacia|remédio|remedio|drogaria/i, categoryNames: ['saúde', 'farmácia'] },
      { pattern: /restaurante|lanche|delivery|ifood|rappi/i, categoryNames: ['alimentação', 'lazer'] },
      { pattern: /netflix|spotify|amazon|disney|streaming/i, categoryNames: ['lazer', 'assinaturas', 'despesas fixas'] },
    ];

    for (const { pattern, categoryNames } of patterns) {
      if (pattern.test(description)) {
        for (const catName of categoryNames) {
          const found = categories.find(c => 
            c.name.toLowerCase().includes(catName.toLowerCase())
          );
          if (found) {
            return found;
          }
        }
      }
    }

    return null;
  }
}


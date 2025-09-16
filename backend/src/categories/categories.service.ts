import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FinancialCategory } from 'src/database/entities/financial-category.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(FinancialCategory)
        private categoryRepository: Repository<FinancialCategory>
    ) {}

    createCategory(data: CreateCategoryDto) {
        const category = this.categoryRepository.create(data);
        return this.categoryRepository.save(category);
    }

    findAll() {
        return this.categoryRepository.find();
    }

    findOne(id: string) {
        return this.categoryRepository.findOne({ where: { id } });
    }

    async remove(id: string) {
        await this.categoryRepository.delete(id);
        return { deleted: true };
    }
}

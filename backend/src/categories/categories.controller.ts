import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoryService: CategoriesService) {}

    @Post()
    create(@Body() CreateCategoryDto: CreateCategoryDto) {
        return this.categoryService.createCategory(CreateCategoryDto);
    }

    @Get()
    findAll() {
        return this.categoryService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.categoryService.findOne(id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.categoryService.remove(id);
    }

}

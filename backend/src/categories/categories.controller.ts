import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @Post()
  create(@Body() CreateCategoryDto: CreateCategoryDto, @Request() req) {
    return this.categoryService.createCategory(
      CreateCategoryDto,
      req.user.userId,
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.categoryService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.categoryService.remove(id, req.user.userId);
  }
}

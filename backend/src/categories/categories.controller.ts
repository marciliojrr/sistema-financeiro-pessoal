import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
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

  @Get('suggest')
  async suggest(
    @Query('description') description: string,
    @Query('profileId') profileId: string,
  ) {
    const category = await this.categoryService.suggestCategory(
      description,
      profileId,
    );
    return category ? { suggested: true, category } : { suggested: false };
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


import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService } from './imports.service';
import { ImportFileDto } from './dto/import-file.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Express } from 'express';

@ApiTags('imports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('ofx')
  @ApiOperation({ summary: 'Importar arquivo OFX' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        profileId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importOfx(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportFileDto,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    return this.importsService.importOfx(
      req.user.userId,
      dto.profileId,
      file.buffer,
    );
  }

  @Post('csv')
  @ApiOperation({ summary: 'Importar arquivo CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        profileId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportFileDto,
  ) {
    if (!file) throw new BadRequestException('Arquivo não enviado');
    return this.importsService.importCsv(
      req.user.userId,
      dto.profileId,
      file.buffer,
    );
  }
}

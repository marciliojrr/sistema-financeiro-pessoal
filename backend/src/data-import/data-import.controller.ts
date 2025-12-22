import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DataImportService } from './data-import.service';
import { ImportDataDto, ImportSource } from './dto/import-data.dto';

@ApiTags('Data Import')
@Controller('data-import')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Post('csv')
  @ApiOperation({ summary: 'Importar movimentações de arquivo CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Arquivo CSV com colunas: date, description, amount, type, category',
        },
        profileId: { type: 'string' },
        defaultCategoryId: { type: 'string' },
      },
      required: ['file', 'profileId'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @Request() req: { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { profileId: string; defaultCategoryId?: string },
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo CSV é obrigatório.');
    }

    return this.dataImportService.importFromCsv(
      req.user.id,
      body.profileId,
      file,
      body.defaultCategoryId,
    );
  }

  @Get('banks')
  @ApiOperation({ summary: 'Listar bancos disponíveis para Open Banking' })
  getAvailableBanks() {
    return this.dataImportService.getAvailableBanks();
  }

  @Get('authorize')
  @ApiOperation({ summary: 'Obter URL de autorização para Open Banking' })
  @ApiQuery({ name: 'bankId', required: true })
  @ApiQuery({ name: 'redirectUri', required: true })
  getAuthorizationUrl(
    @Query('bankId') bankId: string,
    @Query('redirectUri') redirectUri: string,
  ) {
    const url = this.dataImportService.getAuthorizationUrl(bankId, redirectUri);
    return { authorizationUrl: url };
  }

  @Post('token')
  @ApiOperation({ summary: 'Trocar código de autorização por token' })
  async exchangeToken(@Body() body: { bankId: string; code: string }) {
    const accessToken = await this.dataImportService.exchangeCodeForToken(
      body.bankId,
      body.code,
    );
    return { accessToken };
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Listar contas do banco' })
  @ApiQuery({ name: 'bankId', required: true })
  @ApiQuery({ name: 'accessToken', required: true })
  async getBankAccounts(
    @Query('bankId') bankId: string,
    @Query('accessToken') accessToken: string,
  ) {
    return this.dataImportService.getBankAccounts(bankId, accessToken);
  }

  @Post('open-banking')
  @ApiOperation({ summary: 'Importar transações do Open Banking' })
  async importFromOpenBanking(
    @Request() req: { user: { id: string } },
    @Body()
    body: {
      profileId: string;
      bankId: string;
      accessToken: string;
      accountId: string;
      startDate: string;
      endDate: string;
      defaultCategoryId?: string;
    },
  ) {
    return this.dataImportService.importFromOpenBanking(
      req.user.id,
      body.profileId,
      body.bankId,
      body.accessToken,
      body.accountId,
      new Date(body.startDate),
      new Date(body.endDate),
      body.defaultCategoryId,
    );
  }

  // Callback mock para desenvolvimento
  @Get('mock-callback')
  @ApiOperation({ summary: 'Callback mock para teste de Open Banking' })
  mockCallback(@Query('redirect') redirect: string) {
    // Em produção, isso seria substituído pela resposta real do banco
    const mockCode = `mock_auth_code_${Date.now()}`;
    return {
      message: 'Autorização mockada concluída',
      code: mockCode,
      redirectTo: `${redirect}?code=${mockCode}`,
    };
  }
}

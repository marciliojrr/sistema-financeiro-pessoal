import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Readable } from 'stream';
import {
  FinancialMovement,
  MovementType,
} from '../database/entities/financial-movement.entity';
import { Profile } from '../database/entities/profile.entity';
import { FinancialCategory } from '../database/entities/financial-category.entity';
import { ImportSource } from './dto/import-data.dto';
import {
  BankProvider,
  BankTransaction,
} from './providers/bank-provider.interface';
import { MockBankProvider } from './providers/mock-bank.provider';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parse } = require('csv-parse');

interface CsvRow {
  date: string;
  description: string;
  amount: string;
  type: string;
  category?: string;
  [key: string]: string | undefined;
}

@Injectable()
export class DataImportService {
  private bankProviders: Map<string, BankProvider> = new Map();

  constructor(
    @InjectRepository(FinancialMovement)
    private readonly movementRepository: Repository<FinancialMovement>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(FinancialCategory)
    private readonly categoryRepository: Repository<FinancialCategory>,
  ) {
    // Registra provedores disponíveis
    const mockProvider = new MockBankProvider();
    this.bankProviders.set(mockProvider.bankId, mockProvider);
  }

  /**
   * Importa movimentações de um arquivo CSV
   */
  async importFromCsv(
    userId: string,
    profileId: string,
    file: Express.Multer.File,
    defaultCategoryId?: string,
  ): Promise<{ imported: number; errors: string[] }> {
    // Valida perfil
    const profile = await this.validateProfile(userId, profileId);

    // Busca categoria padrão
    let defaultCategory: FinancialCategory | null = null;
    if (defaultCategoryId) {
      defaultCategory = await this.categoryRepository.findOne({
        where: { id: defaultCategoryId },
      });
    }

    // Parse do CSV
    const rows = await this.parseCsv(file.buffer);
    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        await this.createMovementFromRow(row, profile, defaultCategory);
        imported++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro desconhecido';
        errors.push(`Linha ${i + 2}: ${message}`);
      }
    }

    return { imported, errors };
  }

  /**
   * Importa transações do Open Banking
   */
  async importFromOpenBanking(
    userId: string,
    profileId: string,
    bankId: string,
    accessToken: string,
    accountId: string,
    startDate: Date,
    endDate: Date,
    defaultCategoryId?: string,
  ): Promise<{ imported: number; errors: string[] }> {
    const profile = await this.validateProfile(userId, profileId);
    const provider = this.bankProviders.get(bankId);

    if (!provider) {
      throw new BadRequestException(`Banco "${bankId}" não suportado.`);
    }

    let defaultCategory: FinancialCategory | null = null;
    if (defaultCategoryId) {
      defaultCategory = await this.categoryRepository.findOne({
        where: { id: defaultCategoryId },
      });
    }

    const transactions = await provider.getTransactions(
      accessToken,
      accountId,
      startDate,
      endDate,
    );

    const errors: string[] = [];
    let imported = 0;

    for (const tx of transactions) {
      try {
        await this.createMovementFromBankTransaction(
          tx,
          profile,
          defaultCategory,
        );
        imported++;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro desconhecido';
        errors.push(`Transação ${tx.reference || tx.description}: ${message}`);
      }
    }

    return { imported, errors };
  }

  /**
   * Lista bancos disponíveis para integração
   */
  getAvailableBanks(): Array<{ id: string; name: string }> {
    return Array.from(this.bankProviders.values()).map((p) => ({
      id: p.bankId,
      name: p.bankName,
    }));
  }

  /**
   * Obtém URL de autorização para um banco
   */
  getAuthorizationUrl(bankId: string, redirectUri: string): string {
    const provider = this.bankProviders.get(bankId);
    if (!provider) {
      throw new BadRequestException(`Banco "${bankId}" não suportado.`);
    }
    return provider.getAuthorizationUrl(redirectUri);
  }

  /**
   * Troca código de autorização por token de acesso
   */
  async exchangeCodeForToken(bankId: string, code: string): Promise<string> {
    const provider = this.bankProviders.get(bankId);
    if (!provider) {
      throw new BadRequestException(`Banco "${bankId}" não suportado.`);
    }
    return provider.exchangeCodeForToken(code);
  }

  /**
   * Lista contas disponíveis em um banco
   */
  async getBankAccounts(bankId: string, accessToken: string) {
    const provider = this.bankProviders.get(bankId);
    if (!provider) {
      throw new BadRequestException(`Banco "${bankId}" não suportado.`);
    }
    return provider.getAccounts(accessToken);
  }

  // ==================== Métodos Privados ====================

  private async validateProfile(
    userId: string,
    profileId: string,
  ): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    if (profile.user.id !== userId) {
      throw new ForbiddenException('Acesso negado ao perfil.');
    }

    return profile;
  }

  private async parseCsv(buffer: Buffer): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
      const results: CsvRow[] = [];

      const stream = Readable.from(buffer.toString('utf-8'));

      stream
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            delimiter: [',', ';'],
            trim: true,
          }),
        )
        .on('data', (row: CsvRow) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  private async createMovementFromRow(
    row: CsvRow,
    profile: Profile,
    defaultCategory: FinancialCategory | null,
  ): Promise<FinancialMovement> {
    // Normaliza campos (suporta PT-BR e EN)
    const date = row.date || (row as Record<string, string>)['Data'];
    const description =
      row.description ||
      (row as Record<string, string>)['Descricao'] ||
      (row as Record<string, string>)['Descrição'];
    const amountStr = row.amount || (row as Record<string, string>)['Valor'];
    const typeStr = row.type || (row as Record<string, string>)['Tipo'];
    const categoryName =
      row.category || (row as Record<string, string>)['Categoria'];

    if (!date || !description || !amountStr || !typeStr) {
      throw new BadRequestException(
        'Campos obrigatórios faltando: date, description, amount, type',
      );
    }

    // Parse amount (suporta formato BR: 1.234,56)
    const amount = this.parseAmount(amountStr);

    // Determina tipo
    const type = this.parseType(typeStr);

    // Busca ou usa categoria padrão
    let category = defaultCategory;
    if (categoryName) {
      const foundCategory = await this.categoryRepository.findOne({
        where: { name: categoryName },
      });
      if (foundCategory) {
        category = foundCategory;
      }
    }

    if (!category) {
      throw new BadRequestException(
        'Categoria não encontrada e nenhuma categoria padrão definida.',
      );
    }

    const movement = this.movementRepository.create({
      date: new Date(date),
      description,
      amount,
      type,
      profile,
      category,
    });

    return this.movementRepository.save(movement);
  }

  private async createMovementFromBankTransaction(
    tx: BankTransaction,
    profile: Profile,
    defaultCategory: FinancialCategory | null,
  ): Promise<FinancialMovement> {
    let category = defaultCategory;

    if (tx.category) {
      const foundCategory = await this.categoryRepository.findOne({
        where: { name: tx.category },
      });
      if (foundCategory) {
        category = foundCategory;
      }
    }

    if (!category) {
      throw new BadRequestException(
        'Categoria não encontrada para transação do banco.',
      );
    }

    const movement = this.movementRepository.create({
      date: new Date(tx.date),
      description: tx.description,
      amount: tx.amount,
      type: tx.type === 'income' ? MovementType.INCOME : MovementType.EXPENSE,
      profile,
      category,
    });

    return this.movementRepository.save(movement);
  }

  private parseAmount(amountStr: string): number {
    // Remove espaços
    let cleaned = amountStr.trim();

    // Detecta formato BR (1.234,56) vs EN (1,234.56)
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Verifica qual vem por último
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');

      if (lastComma > lastDot) {
        // Formato BR: 1.234,56
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // Formato EN: 1,234.56
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (cleaned.includes(',')) {
      // Pode ser BR (1234,56) ou EN separador de milhar
      // Assume BR se vírgula é decimal
      cleaned = cleaned.replace(',', '.');
    }

    const amount = parseFloat(cleaned);
    if (isNaN(amount)) {
      throw new BadRequestException(`Valor inválido: ${amountStr}`);
    }

    return Math.abs(amount);
  }

  private parseType(typeStr: string): MovementType {
    const normalized = typeStr.toLowerCase().trim();

    if (
      normalized === 'income' ||
      normalized === 'receita' ||
      normalized === 'entrada' ||
      normalized === 'crédito' ||
      normalized === 'credito'
    ) {
      return MovementType.INCOME;
    }

    if (
      normalized === 'expense' ||
      normalized === 'despesa' ||
      normalized === 'saída' ||
      normalized === 'saida' ||
      normalized === 'débito' ||
      normalized === 'debito'
    ) {
      return MovementType.EXPENSE;
    }

    throw new BadRequestException(
      `Tipo inválido: ${typeStr}. Use: income/expense ou receita/despesa`,
    );
  }
}

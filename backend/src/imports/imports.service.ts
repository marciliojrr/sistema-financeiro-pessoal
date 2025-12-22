import { Injectable, BadRequestException } from '@nestjs/common';
import { FinancialMovementsService } from '../financial-movements/financial-movements.service';
import { CreateFinancialMovementDto } from '../financial-movements/dto/create-financial-movement.dto';
import { MovementType } from '../database/entities/financial-movement.entity';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CategoriesService } from '../categories/categories.service';

interface CsvRow {
  Date?: string;
  Data?: string;
  date?: string;
  data?: string;
  Description?: string;
  Descricao?: string;
  Memo?: string;
  description?: string;
  Amount?: string;
  Valor?: string;
  amount?: string;
  valor?: string;
  Category?: string;
  Categoria?: string;
  category?: string;
  categoria?: string;
  Type?: string;
  Tipo?: string;
  type?: string;
  tipo?: string;
  [key: string]: string | undefined;
}

@Injectable()
export class ImportsService {
  constructor(
    private readonly movementsService: FinancialMovementsService,
    private readonly auditLogsService: AuditLogsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async importOfx(userId: string, profileId: string, buffer: Buffer) {
    const fileContent = buffer.toString('utf8');
    // Using Regex parser for resiliency against bad OFX SGML
    const transactions = this.parseOfxRegex(fileContent);

    return this.processTransactions(userId, profileId, transactions);
  }

  async importCsv(userId: string, profileId: string, buffer: Buffer) {
    const results: CsvRow[] = [];
    const stream = Readable.from(buffer);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data: CsvRow) => results.push(data))
        .on('end', async () => {
          try {
            // Map CSV columns to generic structure
            // Assuming columns: Date, Description, Amount
            const mapped = results.map((row) => {
              // Try to find columns case-insensitive
              const date =
                row['Date'] || row['Data'] || row['date'] || row['data'];
              const desc =
                row['Description'] ||
                row['Descricao'] ||
                row['Memo'] ||
                row['description'];
              const amount =
                row['Amount'] || row['Valor'] || row['amount'] || row['valor'];
              const category =
                row['Category'] ||
                row['Categoria'] ||
                row['category'] ||
                row['categoria'];
              const typeStr =
                row['Type'] || row['Tipo'] || row['type'] || row['tipo'];

              // Basic parsing
              let parsedDate = new Date(date || '');
              if (isNaN(parsedDate.getTime()) && date) {
                // Fallback for DD/MM/YYYY
                const parts = date.split('/');
                if (parts.length === 3) {
                  parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                }
              }

              return {
                date: parsedDate,
                description: desc || 'Importado via CSV',
                amount: parseFloat(amount?.replace(',', '.') || '0'),
                categoryName: category,
                typeStr: typeStr,
              };
            });

            const report = await this.processTransactions(
              userId,
              profileId,
              mapped,
            );
            resolve(report);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (err) =>
          reject(new BadRequestException('Erro ao ler CSV')),
        );
    });
  }

  private parseOfxRegex(content: string) {
    // Regex simplified for <STMTTRN> capture
    const transactions: any[] = [];
    const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
      const block = match[1];

      const typeMatch = block.match(/<TRNTYPE>(.*)/);
      const dateMatch = block.match(/<DTPOSTED>(.*)/);
      const amountMatch = block.match(/<TRNAMT>(.*)/);
      const memoMatch = block.match(/<MEMO>(.*)/); // or NAME

      if (dateMatch && amountMatch) {
        const rawDate = dateMatch[1].trim(); // YYYYMMDDHHMMSS usually
        const year = rawDate.substring(0, 4);
        const month = rawDate.substring(4, 6);
        const day = rawDate.substring(6, 8);

        const amount = parseFloat(amountMatch[1].trim());

        transactions.push({
          date: new Date(`${year}-${month}-${day}`),
          amount: amount,
          description: memoMatch ? memoMatch[1].trim() : 'Transação OFX',
          type: typeMatch ? typeMatch[1].trim() : 'OTHER', // This is OFX Type, not our Enum
        });
      }
    }
    return transactions;
  }

  private async processTransactions(
    userId: string,
    profileId: string,
    transactions: any[],
  ) {
    let imported = 0;
    let skipped = 0;

    const categories = await this.categoriesService.findByProfile(profileId);

    for (const t of transactions) {
      if (
        typeof t.amount !== 'number' ||
        isNaN(t.amount) ||
        !t.date ||
        isNaN(t.date.getTime())
      ) {
        skipped++;
        continue;
      }

      // Determine Type (Expense/Income)
      // If amount is negative, it's expense. We store POSITIVE amount and correct TYPE.
      let type = t.amount < 0 ? MovementType.EXPENSE : MovementType.INCOME;
      const absAmount = Math.abs(t.amount);

      if (t.typeStr) {
        const ts = t.typeStr.toLowerCase();
        if (ts === 'income' || ts === 'receita') type = MovementType.INCOME;
        else if (ts === 'expense' || ts === 'despesa')
          type = MovementType.EXPENSE;
      }

      // Resolve Category
      let categoryId: string | undefined;
      if (t.categoryName) {
        const cat = categories.find(
          (c) => c.name.toLowerCase() === t.categoryName.toLowerCase(),
        );
        if (cat) categoryId = cat.id;
      }
      // Default fallback if not found?
      // FinancialMovementsService used 'Outros' or categories[0].
      if (!categoryId && categories.length > 0) {
        const others = categories.find((c) => c.name === 'Outros');
        categoryId = others ? others.id : categories[0].id; // Safe access due to length > 0
      }

      if (!categoryId) {
        skipped++;
        continue;
      }

      const dto: CreateFinancialMovementDto = {
        profileId,
        amount: absAmount,
        date: t.date.toISOString(),
        description: t.description,
        type,
        categoryId,
        // paymentMethod? We could guess based on file source, but default is fine.
      };

      // TODO: Check for duplicates before creating
      // For now, we allow import.

      await this.movementsService.create(dto as any, userId);
      imported++;
    }

    try {
      await this.auditLogsService.logChange(
        userId,
        'CREATE',
        'ImportBatch',
        profileId,
        { count: imported, skipped },
      );
    } catch (e) {
      // Ignore audit error to return report
    }

    return {
      total: transactions.length,
      imported,
      skipped,
    };
  }
}

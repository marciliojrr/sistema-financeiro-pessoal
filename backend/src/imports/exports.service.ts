import { Injectable } from '@nestjs/common';
import { FinancialMovementsService } from '../financial-movements/financial-movements.service';
import { Parser } from 'json2csv';

@Injectable()
export class ExportsService {
  constructor(private readonly movementsService: FinancialMovementsService) {}

  async exportCsv(userId: string, filters?: any): Promise<string> {
    const movements = await this.movementsService.findAll(userId, filters);

    const fields = [
      {
        label: 'Data',
        value: (row: any) =>
          row.date ? new Date(row.date).toISOString().split('T')[0] : '',
      },
      { label: 'Descrição', value: 'description' },
      {
        label: 'Categoria',
        value: (row: any) =>
          row.category ? row.category.name : 'Sem Categoria',
      },
      { label: 'Valor', value: 'amount' },
      { label: 'Tipo', value: 'type' },
    ];

    const json2csvParser = new Parser({
      fields,
      delimiter: ';',
      withBOM: true,
    });

    return json2csvParser.parse(movements);
  }
}

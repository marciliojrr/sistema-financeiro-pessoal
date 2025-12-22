import {
  BankProvider,
  BankAccount,
  BankTransaction,
} from './bank-provider.interface';

/**
 * Mock provider para desenvolvimento e testes.
 * Simula dados de um banco para permitir desenvolvimento
 * da funcionalidade sem integração real.
 */
export class MockBankProvider implements BankProvider {
  readonly bankId = 'mock_bank';
  readonly bankName = 'Banco Mock (Desenvolvimento)';

  getAuthorizationUrl(redirectUri: string): string {
    return `http://localhost:3001/api/v1/data-import/mock-callback?redirect=${encodeURIComponent(redirectUri)}`;
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    // Simula troca de código por token
    return `mock_token_${code}_${Date.now()}`;
  }

  async getAccounts(accessToken: string): Promise<BankAccount[]> {
    // Dados mockados para desenvolvimento
    return [
      {
        id: 'conta_corrente_1',
        name: 'Conta Corrente',
        type: 'checking',
        balance: 5000.0,
      },
      {
        id: 'poupanca_1',
        name: 'Poupança',
        type: 'savings',
        balance: 12500.0,
      },
    ];
  }

  async getTransactions(
    accessToken: string,
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BankTransaction[]> {
    // Gera transações mockadas para o período
    const transactions: BankTransaction[] = [];
    const categories = [
      'Alimentação',
      'Transporte',
      'Lazer',
      'Saúde',
      'Educação',
    ];
    const incomeDescriptions = [
      'Salário',
      'Freelance',
      'Dividendos',
      'Reembolso',
    ];
    const expenseDescriptions = [
      'Supermercado',
      'Uber',
      'Netflix',
      'Farmácia',
      'Curso Online',
      'Restaurante',
      'Gasolina',
    ];

    // Gera 10-20 transações mockadas
    const numTransactions = Math.floor(Math.random() * 11) + 10;

    for (let i = 0; i < numTransactions; i++) {
      const isIncome = Math.random() > 0.7; // 30% receitas, 70% despesas
      const dayOffset = Math.floor(
        Math.random() *
          ((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      );
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayOffset);

      transactions.push({
        date: date.toISOString().split('T')[0],
        description: isIncome
          ? incomeDescriptions[
              Math.floor(Math.random() * incomeDescriptions.length)
            ]
          : expenseDescriptions[
              Math.floor(Math.random() * expenseDescriptions.length)
            ],
        amount: isIncome
          ? Math.floor(Math.random() * 5000) + 500
          : Math.floor(Math.random() * 500) + 10,
        type: isIncome ? 'income' : 'expense',
        category: categories[Math.floor(Math.random() * categories.length)],
        reference: `REF${Date.now()}${i}`,
      });
    }

    return transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }
}

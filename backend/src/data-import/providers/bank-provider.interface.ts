// Interface para provedores de Open Banking
// Padrão Adapter para facilitar integração com diferentes bancos

export interface BankTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category?: string;
  reference?: string;
}

export interface BankAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface BankProvider {
  readonly bankId: string;
  readonly bankName: string;

  // Autenticação OAuth2
  getAuthorizationUrl(redirectUri: string): string;
  exchangeCodeForToken(code: string): Promise<string>;

  // Dados
  getAccounts(accessToken: string): Promise<BankAccount[]>;
  getTransactions(
    accessToken: string,
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BankTransaction[]>;
}

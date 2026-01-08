import { AccountType } from '../enums/account-type.enum';

/**
 * Conta bancária
 */
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color?: string;
  icon?: string;
}

export interface AccountBalance {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
}

export interface TotalBalance {
  totalBalance: number;
  accounts: AccountBalance[];
}

export type CreateAccountDto = Omit<Account, 'id'>;
export type UpdateAccountDto = Partial<CreateAccountDto>;

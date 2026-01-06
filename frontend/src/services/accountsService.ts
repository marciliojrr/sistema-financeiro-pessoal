import api from './api';

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  WALLET = 'WALLET',
}

export interface Account {
  id: string;
  name: string;
  bank?: string;
  type: AccountType;
  initialBalance: number;
  currentBalance?: number;
  active: boolean;
  profile?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountDto {
  name: string;
  bank?: string;
  type: AccountType;
  initialBalance: number;
  profileId: string;
}

export interface UpdateAccountDto extends Partial<CreateAccountDto> {
  active?: boolean;
}

export interface AccountBalance {
  account: Account;
  initialBalance: number;
  currentBalance: number;
  movementsCount: number;
}

export interface TotalBalance {
  totalInitialBalance: number;
  movementsBalance: number;
  totalBalance: number;
  accountsCount: number;
}

export const accountsService = {
  getAll: async (profileId?: string): Promise<Account[]> => {
    const params = profileId ? { profileId } : {};
    const response = await api.get<Account[]>('/accounts', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Account> => {
    const response = await api.get<Account>(`/accounts/${id}`);
    return response.data;
  },

  getBalance: async (id: string): Promise<AccountBalance> => {
    const response = await api.get<AccountBalance>(`/accounts/${id}/balance`);
    return response.data;
  },

  getTotalBalance: async (): Promise<TotalBalance> => {
    const response = await api.get<TotalBalance>('/accounts/total-balance');
    return response.data;
  },

  create: async (data: CreateAccountDto): Promise<Account> => {
    const response = await api.post<Account>('/accounts', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAccountDto): Promise<Account> => {
    const response = await api.put<Account>(`/accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/accounts/${id}`);
  },
};

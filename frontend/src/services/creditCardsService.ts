import api from './api';

export interface CreditCard {
  id: string;
  cardName: string;
  bank: string;
  cardNumber: string; 
  limit: number;
  closingDay: number;
  dueDay: number;
  profileId: string;
}

export interface CreateCreditCardDto {
  cardName: string;
  bank: string;
  cardNumber: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  profileId: string;
}

export interface CreateInstallmentPurchaseDto {
  productName: string;
  totalValue: number;
  installments: number;
  purchaseDate: string; // ISO Date
  creditCardId: string;
  categoryId?: string;
}

export interface PayCreditCardInvoiceDto {
  profileId: string;
  categoryId?: string;
}

export interface creditCardMovement {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
}

export interface CreditCardInvoice {
  id: string;
  month: string; // YYYY-MM
  totalAmount: number;
  year: number;
  status: 'OPEN' | 'CLOSED' | 'PAID';
  previousBalance?: number; // Optional
  paid: boolean; // Backwards compatibility or derived
  financialMovements: creditCardMovement[];
  creditCardId?: string;
  dueDate: string;
  closingDate: string;
}

export const creditCardsService = {
  getAll: async () => {
    const response = await api.get<CreditCard[]>('/credit-cards');
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get<CreditCard>(`/credit-cards/${id}`);
    return response.data;
  },

  create: async (data: CreateCreditCardDto) => {
    const response = await api.post<CreditCard>('/credit-cards', data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/credit-cards/${id}`);
  },

  getRecommendation: async (amount?: number, date?: string) => {
    const response = await api.get('/credit-cards/recommendation', {
      params: { amount, date }
    });
    return response.data;
  },

  createInstallmentPurchase: async (data: CreateInstallmentPurchaseDto) => {
    const response = await api.post('/credit-cards/installment-purchases', data);
    return response.data;
  },

  // Note: Backend might not have a direct "get invoices" endpoint, usually fetched via relation or specialized endpoint?
  // Checking backend controller: no direct "get all invoices by card" endpoint visible in my view_file logs.
  // Wait, let's double check if `findOne` returns relations. 
  // Code snippet: relations: ['profile', 'profile.user']. Does not seem to include 'invoices'.
  // We might need to rely on the "closeInvoice" or "payInvoice" flow, OR maybe implementation plan needs a backend tweak?
  // HOLD ON. Let's assume for now we might need to fetch invoices differently or update backend if needed.
  // Actually, let's keep it simple. If I can't List Invoices, I can't build the Dashboard fully.
  // Re-reading controller...
  // It has `closeInvoice` (POST), `payInvoice` (POST). 
  // It lacks `getInvoices`. I'll have to add it to Frontend service tentatively, but I might fail if backend doesn't support.
  // Let's implement what IS there first.

  getInvoices: async (cardId: string) => {
    const response = await api.get<CreditCardInvoice[]>(`/credit-cards/${cardId}/invoices`);
    return response.data;
  },

  closeInvoice: async (cardId: string, year: number, month: number) => {
    const response = await api.post(`/credit-cards/${cardId}/invoices/close`, { year, month });
    return response.data;
  },

  payInvoice: async (invoiceId: string, data: PayCreditCardInvoiceDto) => {
    const response = await api.post(`/credit-cards/invoices/${invoiceId}/pay`, data);
    return response.data;
  }
};

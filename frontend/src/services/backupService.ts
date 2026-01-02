import api from './api';

export interface BackupData {
  exportDate: string;
  version: string;
  profileId: string;
  data: {
    categories: unknown[];
    movements: unknown[];
    creditCards: unknown[];
    installmentPurchases: unknown[];
    debts: unknown[];
    reserves: unknown[];
    budgets: unknown[];
    recurringTransactions: unknown[];
  };
}

export const backupService = {
  async exportBackup(profileId: string): Promise<Blob> {
    const response = await api.get('/backup/export', {
      params: { profileId },
      responseType: 'blob',
    });
    return response.data;
  },

  async restoreBackup(profileId: string, backup: BackupData): Promise<{ success: boolean; restored: Record<string, number> }> {
    const response = await api.post('/backup/restore', backup, {
      params: { profileId },
    });
    return response.data;
  },
};

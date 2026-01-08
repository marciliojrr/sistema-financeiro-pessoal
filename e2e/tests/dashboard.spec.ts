import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('deve exibir os cards principais do dashboard', async ({ page }) => {
    // Navega para o dashboard (pode redirecionar para login se não autenticado)
    await page.goto('/dashboard');
    
    // Se redirecionou para login, pula o teste
    if (page.url().includes('login')) {
      test.skip();
      return;
    }
    
    // Verifica cards principais
    await expect(page.getByText(/patrimônio|saldo/i)).toBeVisible();
    await expect(page.getByText(/receitas/i)).toBeVisible();
    await expect(page.getByText(/despesas/i)).toBeVisible();
  });

  test('deve exibir seção de próximas contas', async ({ page }) => {
    await page.goto('/dashboard');
    
    if (page.url().includes('login')) {
      test.skip();
      return;
    }
    
    await expect(page.getByText(/próximas contas/i)).toBeVisible();
  });

  test('deve exibir seção de últimas movimentações', async ({ page }) => {
    await page.goto('/dashboard');
    
    if (page.url().includes('login')) {
      test.skip();
      return;
    }
    
    await expect(page.getByText(/últimas movimentações/i)).toBeVisible();
  });

  test('deve exibir seção de reservas', async ({ page }) => {
    await page.goto('/dashboard');
    
    if (page.url().includes('login')) {
      test.skip();
      return;
    }
    
    await expect(page.getByText(/reservas/i)).toBeVisible();
  });
});

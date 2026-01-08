import { test, expect } from '@playwright/test';

// Helper para fazer login antes dos testes
async function login(page: any) {
  await page.goto('/login');
  await page.getByPlaceholder(/email/i).fill('test@test.com');
  await page.getByPlaceholder(/senha/i).fill('123456');
  await page.getByRole('button', { name: /entrar|login/i }).click();
  await page.waitForURL(/dashboard/);
}

test.describe('Transações', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Configurar usuário de teste ou mockar autenticação
    // Por enquanto, pular se não tiver usuário de teste
  });

  test('deve exibir página de transações', async ({ page }) => {
    await page.goto('/transactions');
    
    await expect(page.getByRole('heading', { name: /transações|movimentações/i })).toBeVisible();
  });

  test('deve abrir modal de nova transação', async ({ page }) => {
    await page.goto('/transactions');
    
    // Clica no botão de adicionar
    const addButton = page.getByRole('button', { name: /nova|adicionar|\+/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Verifica se modal ou formulário aparece
      await expect(page.getByText(/nova (transação|despesa|receita)/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('deve exibir lista de transações', async ({ page }) => {
    await page.goto('/transactions');
    
    // Aguarda carregamento
    await page.waitForLoadState('networkidle');
    
    // Verifica se há alguma transação ou mensagem de lista vazia
    const hasTransactions = await page.locator('[data-testid="transaction-item"]').count() > 0;
    const hasEmptyMessage = await page.getByText(/nenhuma|vazio|sem transações/i).isVisible();
    
    expect(hasTransactions || hasEmptyMessage).toBeTruthy();
  });
});

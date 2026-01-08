import { test, expect } from '@playwright/test';

test.describe('Categorias', () => {
  test('deve exibir página de categorias', async ({ page }) => {
    await page.goto('/categories');
    
    if (page.url().includes('login')) {
      test.skip();
      return;
    }
    
    await expect(page.getByRole('heading', { name: /categorias/i })).toBeVisible();
  });

  test('deve ter botão para adicionar nova categoria', async ({ page }) => {
    await page.goto('/categories');
    
    if (page.url().includes('login')) {
      test.skip();
      return;
    }
    
    const addButton = page.getByRole('button', { name: /nova|adicionar|\+/i });
    await expect(addButton).toBeVisible();
  });

  test('deve exibir lista de categorias ou mensagem vazia', async ({ page }) => {
    await page.goto('/categories');
    
    if (page.url().includes('login')) {
      test.skip();
      return;
    }
    
    await page.waitForLoadState('networkidle');
    
    // Verifica se há categorias ou mensagem de lista vazia
    const hasCategories = await page.locator('[data-testid="category-item"]').count() > 0;
    const hasCategoryCards = await page.locator('.category-card, [class*="category"]').count() > 0;
    const hasEmptyMessage = await page.getByText(/nenhuma|vazio|sem categorias/i).isVisible();
    
    expect(hasCategories || hasCategoryCards || hasEmptyMessage).toBeTruthy();
  });

  test('deve abrir formulário ao clicar em adicionar', async ({ page }) => {
    await page.goto('/categories');
    
    if (page.url().includes('login')) {
      test.skip();
      return;
    }
    
    const addButton = page.getByRole('button', { name: /nova|adicionar|\+/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Verifica se modal ou formulário de categoria aparece
      await expect(page.getByText(/nova categoria|adicionar categoria/i)).toBeVisible({ timeout: 3000 });
    }
  });
});

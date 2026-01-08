import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('deve exibir a página de login', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: /login|entrar/i })).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/senha/i)).toBeVisible();
  });

  test('deve exibir erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder(/email/i).fill('usuario@invalido.com');
    await page.getByPlaceholder(/senha/i).fill('senhainvalida');
    await page.getByRole('button', { name: /entrar|login/i }).click();
    
    // Espera mensagem de erro
    await expect(page.getByText(/erro|inválido|incorreto/i)).toBeVisible({ timeout: 5000 });
  });

  test('deve acessar a página de registro', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.getByRole('heading', { name: /registr|cadastr|criar conta/i })).toBeVisible();
    await expect(page.getByPlaceholder(/nome/i)).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
  });

  test('deve redirecionar para login se não autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Deve redirecionar para login
    await expect(page).toHaveURL(/login/);
  });
});

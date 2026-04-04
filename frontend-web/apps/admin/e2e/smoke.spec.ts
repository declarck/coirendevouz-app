import { test, expect } from '@playwright/test';

/**
 * 2-FE-10 — API olmadan çalışabilen minimal smoke (sayfa yüklenir, kritik UI görünür).
 */

test.describe('Panel smoke', () => {
  test('JWT giriş sayfası e-posta alanını gösterir', async ({ page }) => {
    await page.goto('/auth/jwt/sign-in');
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('İşletme kayıt sayfası yüklenir', async ({ page }) => {
    await page.goto('/auth/jwt/business-sign-up');
    await expect(page.getByText('İşletme yöneticisi kaydı')).toBeVisible();
  });

  test('Kök adres yanıt verir', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
  });
});

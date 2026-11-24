import { expect, test } from '@playwright/test';
import { prepararPagina } from './fixtures';

test.beforeEach(async ({ page }) => {
  await prepararPagina(page);
});

test('mobile: drawer acessível (aria, foco, Escape, Tab preso e scroll bloqueado)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');

  const abrir = page.getByRole('button', { name: 'Abrir menu' });
  const drawer = page.locator('#ulsba-menu-lateral');
  const fechar = page.getByRole('button', { name: 'Fechar menu' });

  await expect(abrir).toBeVisible();
  const caixaAbrir = await abrir.boundingBox();
  expect(caixaAbrir).not.toBeNull();
  expect(caixaAbrir!.width).toBeGreaterThanOrEqual(44);
  expect(caixaAbrir!.height).toBeGreaterThanOrEqual(44);
  await expect(abrir).toHaveAttribute('aria-expanded', 'false');
  await expect(abrir).toHaveAttribute('aria-controls', 'ulsba-menu-lateral');

  await abrir.click();

  await expect(abrir).toHaveAttribute('aria-expanded', 'true');
  await expect(drawer).toHaveAttribute('role', 'dialog');
  await expect(drawer).toHaveAttribute('aria-modal', 'true');
  await expect(drawer).toHaveAttribute('aria-label', 'Menu de navegação');
  await expect(drawer).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

  await expect(fechar).toBeVisible();
  const caixaFechar = await fechar.boundingBox();
  expect(caixaFechar).not.toBeNull();
  expect(caixaFechar!.width).toBeGreaterThanOrEqual(44);
  expect(caixaFechar!.height).toBeGreaterThanOrEqual(44);

  // Shift+Tab a partir do contentor do drawer vai para o último controlo
  // (Sair); Tab a partir do último volta ao primeiro (Fechar).
  const sair = drawer.getByRole('button', { name: 'Sair' });
  await page.keyboard.press('Shift+Tab');
  await expect(sair).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(fechar).toBeFocused();

  // Fechar pelo botão devolve o foco ao botão de abrir e repõe o scroll.
  await fechar.click();
  await expect(abrir).toBeFocused();
  await expect(abrir).toHaveAttribute('aria-expanded', 'false');
  await expect(drawer).not.toHaveAttribute('role', 'dialog');
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');

  // Escape fecha e devolve o foco ao botão de abrir.
  await abrir.click();
  await expect(drawer).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(abrir).toBeFocused();
  await expect(abrir).toHaveAttribute('aria-expanded', 'false');
  await expect(drawer).not.toHaveAttribute('role', 'dialog');
});

test('desktop: sidebar fixa, sem botões de abrir/fechar e sem semântica de dialog', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await expect(page.locator('.ulsba-menu-btn')).toBeHidden();
  await expect(page.locator('.side-drawer-fechar')).toBeHidden();

  const drawer = page.locator('#ulsba-menu-lateral');
  await expect(drawer).toBeVisible();
  await expect(drawer).not.toHaveAttribute('role', 'dialog');
  await expect(drawer).not.toHaveAttribute('aria-modal', 'true');
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
});

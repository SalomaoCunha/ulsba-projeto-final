import { expect, test } from '@playwright/test';
import { prepararPagina } from './fixtures';

test.beforeEach(async ({ page }) => {
  await prepararPagina(page);
});

test('mobile: cartões de viatura visíveis e tabela escondida', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/viaturas');

  const cartoes = page.locator('.ulsba-table-card-shell > .d-md-none');
  await expect(cartoes).toBeVisible();
  await expect(cartoes).toContainText('AA-12-BB');
  await expect(cartoes).toContainText('Renault Kangoo');
  await expect(page.locator('.ulsba-table-card-shell > .table-responsive')).toBeHidden();

  // Cada viatura tem 4 ações (Bloqueios, Calendário, Editar, Apagar).
  const acoes = cartoes.getByRole('button', { name: /^(Gerir bloqueios de|Agendar |Editar |Apagar )/ });
  expect(await acoes.count()).toBe(8);
});

test('desktop: tabela visível e cartões escondidos', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/viaturas');

  const tabela = page.locator('.ulsba-table-card-shell > .table-responsive');
  await expect(tabela).toBeVisible();
  await expect(tabela.locator('th').first()).toHaveText('Matrícula');
  await expect(tabela.locator('tbody')).toContainText('AA-12-BB');
  await expect(page.locator('.ulsba-table-card-shell > .d-md-none')).toBeHidden();
});

test('breakpoint 767/768: alterna entre cartões e tabela', async ({ page }) => {
  await page.setViewportSize({ width: 767, height: 800 });
  await page.goto('/viaturas');
  await expect(page.locator('.ulsba-table-card-shell > .d-md-none')).toBeVisible();
  await expect(page.locator('.ulsba-table-card-shell > .table-responsive')).toBeHidden();

  await page.setViewportSize({ width: 768, height: 800 });
  await expect(page.locator('.ulsba-table-card-shell > .table-responsive')).toBeVisible();
  await expect(page.locator('.ulsba-table-card-shell > .d-md-none')).toBeHidden();
});

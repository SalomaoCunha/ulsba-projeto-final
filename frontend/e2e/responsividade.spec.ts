import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { prepararPagina, semScrollHorizontal } from './fixtures';

const ROTAS = ['/', '/mapa', '/agenda', '/viaturas'] as const;
const LARGURAS = [320, 390, 767, 768, 1280];

test.beforeEach(async ({ page }) => {
  await prepararPagina(page);
});

async function esperarCarregada(page: Page, rota: (typeof ROTAS)[number]) {
  if (rota === '/' || rota === '/mapa') {
    await expect(page.locator('.leaflet-container').first()).toBeVisible();
  } else if (rota === '/agenda') {
    await expect(page.locator('.agenda-calendar-scroll + div')).toBeVisible();
  } else {
    await expect(page.locator('.ulsba-table-card-shell')).toBeVisible();
  }
}

test('dashboard/mapa em mobile: mapa visível, dentro do ecrã e colunas empilhadas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');

  const mapa = page.locator('.leaflet-container').first();
  await expect(mapa).toBeVisible();
  const caixaMapa = await mapa.boundingBox();
  expect(caixaMapa).not.toBeNull();
  expect(caixaMapa!.width).toBeGreaterThan(100);
  expect(caixaMapa!.x).toBeGreaterThanOrEqual(0);
  expect(caixaMapa!.x + caixaMapa!.width).toBeLessThanOrEqual(390 + 1);

  const ficha = await page.locator('.dashboard-col-ficha').boundingBox();
  const colunaMapa = await page.locator('.dashboard-col-mapa').boundingBox();
  expect(ficha).not.toBeNull();
  expect(colunaMapa).not.toBeNull();
  expect(colunaMapa!.y).toBeGreaterThanOrEqual(ficha!.y + ficha!.height - 1);
});

test('dashboard/mapa em desktop: três colunas lado a lado', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await expect(page.locator('.leaflet-container').first()).toBeVisible();
  const ficha = await page.locator('.dashboard-col-ficha').boundingBox();
  const colunaMapa = await page.locator('.dashboard-col-mapa').boundingBox();
  expect(ficha).not.toBeNull();
  expect(colunaMapa).not.toBeNull();
  expect(colunaMapa!.x).toBeGreaterThan(ficha!.x + ficha!.width - 1);
});

for (const largura of LARGURAS) {
  test(`sem overflow horizontal a ${largura}px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 });

    for (const rota of ROTAS) {
      await page.goto(rota);
      await esperarCarregada(page, rota);

      const { scroll, cliente } = await semScrollHorizontal(page);
      expect(scroll, `overflow horizontal em ${rota} a ${largura}px`).toBeLessThanOrEqual(cliente + 1);
    }
  });
}

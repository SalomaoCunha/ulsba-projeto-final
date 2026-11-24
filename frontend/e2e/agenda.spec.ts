import { expect, test } from '@playwright/test';
import { prepararPagina } from './fixtures';

const LEGENDA = '.agenda-calendar-scroll + div';

test.beforeEach(async ({ page }) => {
  await prepararPagina(page);
});

async function caixaDaLegendaECalendario(page: import('@playwright/test').Page) {
  const calendario = await page.locator('.rbc-month-view').boundingBox();
  const legenda = await page.locator(LEGENDA).boundingBox();
  if (!calendario || !legenda) {
    throw new Error('Calendário ou legenda sem caixa visível');
  }
  return { calendario, legenda };
}

test('mobile: lista de eventos e legenda sem sobreposição', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/agenda');

  const lista = page.locator('.agenda-lista-mobile');
  await expect(lista).toBeVisible();
  await expect(lista).toContainText('Volta Beja Centro');

  const itens = page.locator('.agenda-evento-mobile-item');
  await expect(itens.first()).toBeVisible();
  expect(await itens.count()).toBeGreaterThanOrEqual(3);

  const legenda = page.locator(LEGENDA);
  await expect(legenda).toBeVisible();
  await expect(legenda).toContainText('Rascunho');
  await expect(legenda).toContainText('Viatura indisponível / bloqueada');

  const { calendario, legenda: caixaLegenda } = await caixaDaLegendaECalendario(page);
  // A legenda tem de começar depois do fim da grelha do mês: se a grelha
  // voltar a ter altura fixa, as linhas transbordam e esta asserção falha.
  expect(caixaLegenda.y).toBeGreaterThanOrEqual(calendario.y + calendario.height - 0.5);
});

test('desktop: legenda visível e sem sobreposição, lista mobile escondida', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/agenda');

  await expect(page.locator('.agenda-lista-mobile')).toBeHidden();
  await expect(page.locator('.rbc-month-view')).toBeVisible();

  const legenda = page.locator(LEGENDA);
  await expect(legenda).toBeVisible();
  await expect(legenda).toContainText('Rascunho');

  const { calendario, legenda: caixaLegenda } = await caixaDaLegendaECalendario(page);
  expect(caixaLegenda.y).toBeGreaterThanOrEqual(calendario.y + calendario.height - 0.5);
});

test('breakpoint 767/768: lista mobile alterna com a grelha', async ({ page }) => {
  await page.setViewportSize({ width: 767, height: 800 });
  await page.goto('/agenda');
  await expect(page.locator('.agenda-lista-mobile')).toBeVisible();

  await page.setViewportSize({ width: 768, height: 800 });
  await expect(page.locator('.agenda-lista-mobile')).toBeHidden();
  await expect(page.locator('.rbc-month-view')).toBeVisible();
});

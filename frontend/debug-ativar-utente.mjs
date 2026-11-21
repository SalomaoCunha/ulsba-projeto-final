import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
const erros = [];
page.on('pageerror', (err) => erros.push(err.message));
page.on('console', (msg) => { if (msg.type() === 'error') erros.push(msg.text()); });

await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'coordenador.teste@ulsba.invalid');
await page.fill('input[type="password"]', 'Teste@1234');
await page.click('button[type="submit"]');
await page.waitForTimeout(1500);
await page.goto('http://localhost:5173/utentes', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.click('button:has-text("Filtros")');
await page.waitForTimeout(400);
await page.selectOption('select:near(:text("Estado"))', 'Referenciado').catch(() => {});
await page.waitForTimeout(600);

// abre o primeiro utente referenciado para editar
const botaoEditar = page.locator('button:visible').filter({ has: page.locator('.bi-pencil') }).first();
await botaoEditar.click();
await page.waitForTimeout(600);

const corpoAntes = await page.locator('body').innerText();
console.log('Mostra botao Ativar:', corpoAntes.includes('Ativar'));

await page.click('button:has-text("Ativar")');
await page.waitForTimeout(300);
await page.fill('textarea[placeholder="Obrigatório"]', 'Teste automatico de ativacao');
await page.click('button:has-text("Confirmar")');
await page.waitForTimeout(1200);

const corpoDepois = await page.locator('body').innerText();
console.log('Mostra "Estado atual: Ativo" depois:', corpoDepois.includes('Estado atual:') && corpoDepois.includes('Ativo'));
console.log('ERROS:', erros.length ? erros.join(' | ') : '(nenhum)');
await browser.close();

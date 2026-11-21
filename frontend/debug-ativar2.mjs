import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage();
const erros = [];
const respostas = [];
page.on('pageerror', (err) => erros.push(err.message));
page.on('console', (msg) => { if (msg.type() === 'error') erros.push(msg.text()); });
page.on('response', (res) => { if (res.url().includes('/ativar')) respostas.push(res.url()+' -> '+res.status()); });

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

const botaoEditar = page.locator('button:visible').filter({ has: page.locator('.bi-pencil') }).first();
await botaoEditar.click();
await page.waitForTimeout(600);
await page.click('button:has-text("Ativar")');
await page.waitForTimeout(300);
await page.fill('textarea[placeholder="Obrigatório"]', 'Teste automatico de ativacao');
await page.click('button:has-text("Confirmar")');
await page.waitForTimeout(1500);

const corpoDepois = await page.locator('body').innerText();
const trechoEstado = corpoDepois.match(/Estado atual:[^\n]*/);
console.log('Trecho estado:', trechoEstado ? trechoEstado[0] : '(nao encontrado)');
console.log('Respostas /ativar:', respostas.length ? respostas.join(' | ') : '(nenhuma)');
console.log('ERROS:', erros.length ? erros.join(' | ') : '(nenhum)');
await browser.close();

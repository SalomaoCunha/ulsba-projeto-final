import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'coordenador.teste@ulsba.invalid');
await page.fill('input[type="password"]', 'Teste@1234');
await page.click('button[type="submit"]');
await page.waitForTimeout(1500);
await page.goto('http://localhost:5173/utentes/novo', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.click('button:has-text("Criar novo local")');
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(400);
await page.screenshot({ path: 'C:/Users/tiago/AppData/Local/Temp/claude/89cdf32d9d12e8b2/60f84757-a214-4ab3-9a9c-540e89a8ba80/scratchpad/criar-local-scroll.png', fullPage: false });

// tenta submeter sem clicar no mapa, para ver a mensagem de erro
await page.fill('#novo-local-morada', 'Rua Teste UX, 1');
await page.fill('#novo-local-localidade', 'Beja');
await page.locator('#novo-local-concelho').selectOption({ index: 1 });
await page.fill('input[name="numeroUtente"]', String(Date.now()).slice(-8));
await page.fill('input[name="nome"]', 'Teste UX Local');
await page.fill('input[name="dataNascimento"]', '1950-01-01');
await page.click('button[type="submit"]:has-text("Guardar Utente")');
await page.waitForTimeout(500);
await page.screenshot({ path: 'C:/Users/tiago/AppData/Local/Temp/claude/89cdf32d9d12e8b2/60f84757-a214-4ab3-9a9c-540e89a8ba80/scratchpad/criar-local-erro.png', fullPage: false });
await browser.close();

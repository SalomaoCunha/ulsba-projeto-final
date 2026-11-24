import { defineConfig, devices } from '@playwright/test';

// Porta dedicada aos testes E2E, para não colidir com um `npm run dev` normal.
const PORTA = 4173;
const BASE_URL = `http://127.0.0.1:${PORTA}`;

// Configuração Playwright: sobe o Vite (sem backend), corre os testes em
// Chromium e guarda artefactos (traces/screenshots) dentro de node_modules
// para não poluir o repositório.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  outputDir: 'node_modules/.playwright-results',
  use: {
    baseURL: BASE_URL,
    locale: 'pt-PT',
    timezoneId: 'Europe/Lisbon',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${PORTA} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

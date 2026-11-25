/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Bind mount do Docker Desktop no Windows nem sempre propaga eventos
    // de ficheiro para o container; sem polling o Vite não vê as gravações.
    watch: {
      usePolling: true,
    },
  },
  test: {
    // e2e/ contém specs do Playwright (test.beforeEach do @playwright/test),
    // que o vitest não consegue executar; sem este exclude, "npm run test"
    // tenta correr e2e/*.spec.ts e falha com erro de suite.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})
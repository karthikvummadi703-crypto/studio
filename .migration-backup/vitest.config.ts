import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      // Enforces minimum coverage so tests cannot silently regress
      thresholds: {
        lines: 65,
        functions: 65,
        branches: 55,
        statements: 65,
      },
      exclude: [
        'node_modules/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        'src/components/ui/**',
        'src/app/globals.css',
      ],
    },
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

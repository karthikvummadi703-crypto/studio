import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: [
        'node_modules/**', 'src/test/**',
        'src/app/api/**', 'src/middleware.ts',
        'src/middleware.test.ts', 'dist/**',
      ],
    },
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: [
      'node_modules/**', 'dist/**',
      'src/app/api/**', 'src/middleware.test.ts',
      'src/components/ai/rc/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // genkit is a server-only package; alias to zod so tests can import its
      // re-exported z without requiring the full genkit runtime.
      'genkit': 'zod',
    },
  },
});

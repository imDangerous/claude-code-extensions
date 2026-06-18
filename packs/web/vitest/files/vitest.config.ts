import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// 스캐폴드(ccx) — 프로젝트 소유. React 컴포넌트/유닛 테스트(jsdom).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.config.*', '.next/'],
    },
  },
});

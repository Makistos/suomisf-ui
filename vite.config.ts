/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from 'vite-tsconfig-paths'
import istanbul from 'vite-plugin-istanbul';
import { cpSync } from "node:fs";
import { resolve } from "node:path";

// index.html links the PrimeReact theme files from node_modules. Vite copies
// those stylesheets to assets/ as they are, so their url("./fonts/...")
// references point at assets/fonts/; put the theme's Roboto files there.
// (Both mdc-*-indigo themes ship the same font files.)
const themeFonts = () => ({
  name: 'copy-primereact-theme-fonts',
  apply: 'build' as const,
  writeBundle(options: { dir?: string }) {
    cpSync(
      resolve(__dirname, 'node_modules/primereact/resources/themes/mdc-light-indigo/fonts'),
      resolve(options.dir ?? 'build', 'assets/fonts'),
      { recursive: true });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isE2e = mode === 'e2e';
  // `npm run test:e2e:coverage` builds the E2E frontend with Istanbul
  // counters (window.__coverage__); tests/fixtures/coverage.ts collects them.
  const e2eCoverage = isE2e && !!process.env.E2E_COVERAGE;
  return {
    plugins: [
      react(),
      viteTsconfigPaths({
      }),
      themeFonts(),
      e2eCoverage && istanbul({
        include: 'src/*',
        exclude: ['node_modules', 'src/**/*.test.{ts,tsx}'],
        extension: ['.ts', '.tsx'],
        forceBuildInstrument: true,
      }),
    ],
    build: {
      // Separate output dir so an e2e build never collides with a real
      // deployment build in build/.
      outDir: isE2e ? 'build-e2e' : 'build',
    },
    server: {
      open: !isE2e,
      port: isE2e ? 3100 : 3000
    },
    preview: {
      port: isE2e ? 3100 : 4173,
    },
    test: {
      // Unit tests only; Playwright E2E specs live in tests/.
      include: ['src/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
        reporter: ['text-summary', 'html'],
      },
    },
  };
});

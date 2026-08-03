import { defineConfig } from 'vite';

/**
 * Vite configuratie voor AniVault.
 *
 * - `base: './'` zorgt voor relatieve paden in de build, zodat de dist-folder
 *   ook werkt wanneer die niet in de root van een domein staat (bv. GitHub Pages).
 * - De dev-server opent automatisch de browser op poort 5173.
 *
 * Docs: https://vite.dev/config/
 */
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

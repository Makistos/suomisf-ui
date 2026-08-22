import { build, defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isE2e = mode === 'e2e';
  return {
    plugins: [
      react(),
      viteTsconfigPaths({
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
  };
});

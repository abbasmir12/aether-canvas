import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron/simple';

// VS Code is itself an Electron application and can leak these variables into
// its integrated terminal. If they reach vite-plugin-electron, the plugin may
// resolve Code.exe instead of this project's Electron binary.
delete process.env.ELECTRON_OVERRIDE_DIST_PATH;
delete process.env.ELECTRON_RUN_AS_NODE;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'src/main/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['better-sqlite3', 'chokidar', 'dotenv', 'openai', 'sharp'],
            },
          },
        },
      },
      preload: {
        input: 'src/main/preload.ts',
      },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

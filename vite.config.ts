import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import obfuscator from 'vite-plugin-javascript-obfuscator';

export default defineConfig({
  plugins: [
    react(),
    obfuscator({
      options: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true,
        debugProtectionInterval: 2000,
        disableConsoleOutput: true,
        identifierNamesGenerator: 'hexadecimal',
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 5,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ['base64', 'rc4'],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersType: 'variable',
        stringArrayThreshold: 0.8,
        unicodeEscapeSequence: false,
      },
      apply: 'build', // Obfuscate only on production build
    }),
  ],
  server: {
    // Dev-mode API proxy: the Vite dev server alone has no /api routes.
    // Without this, shop-setting saves and settings fetches silently fail
    // in `npm run dev` (the dashboard shows "saved" but nothing reaches
    // the server, so the customer phone never sees the change).
    // Run the backend too: `npm run server` (port 5000).
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false, // Absolutely NO source maps exposed
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
        },
      },
    },
  },
});

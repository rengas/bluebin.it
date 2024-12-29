import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 5173
    },
    build: {
        outDir: 'dist'
    },
    // Handle client-side routing in production
    preview: {
        port: 3000
    }
});
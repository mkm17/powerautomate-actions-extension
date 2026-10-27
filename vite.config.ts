import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The service worker and content script are referenced by fixed paths in manifest.json and must be
// classic single-file scripts (content scripts cannot be ES modules), so each is built separately as an IIFE.
const scriptEntries: Record<string, string> = {
    content: 'src/chrome/Content.ts',
    background: 'src/chrome/Background.ts',
};

export default defineConfig(({ mode }) => {
    const scriptEntry = scriptEntries[mode];
    if (scriptEntry) {
        return {
            publicDir: false,
            define: { 'process.env.NODE_ENV': JSON.stringify('production') },
            build: {
                outDir: 'build',
                emptyOutDir: false,
                lib: {
                    entry: scriptEntry,
                    name: mode,
                    formats: ['iife'],
                    fileName: () => `static/js/${mode}.js`,
                },
            },
        };
    }

    return {
        base: './',
        plugins: [react()],
        build: {
            outDir: 'build',
            assetsDir: 'static',
            // The popup bundles Fluent UI; size matters less for a locally installed extension.
            chunkSizeWarningLimit: 1000,
        },
    };
});

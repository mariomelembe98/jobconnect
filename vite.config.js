import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return;
                    }

                    const packagePath = id.split('node_modules/').pop();

                    if (!packagePath) {
                        return 'vendor';
                    }

                    const [scopeOrPackage, packageName] = packagePath.split('/');
                    const chunkName = scopeOrPackage.startsWith('@')
                        ? `${scopeOrPackage}/${packageName}`
                        : scopeOrPackage;

                    if (!chunkName) {
                        return 'vendor';
                    }

                    return `vendor-${chunkName.replace('@', '').replaceAll('/', '-')}`;
                },
            },
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import UnpluginInjectPreload from 'unplugin-inject-preload/vite';
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            createHtmlPlugin({
                inject: {
                    data: {
                        VITE_CUSTOM_HTML_SCRIPT:
                            env.VITE_CUSTOM_HTML_SCRIPT ?? '',
                    },
                },
            }),
            visualizer({
                filename: './stats/stats.html',
                open: false,
            }),
            UnpluginInjectPreload({
                files: [
                    {
                        entryMatch: /logo-light.png$/,
                        outputMatch: /logo-light-.*.png$/,
                    },
                    {
                        entryMatch: /logo-dark.png$/,
                        outputMatch: /logo-dark-.*.png$/,
                    },
                ],
            }),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        build: {
            rollupOptions: {
                output: {
                    assetFileNames: (assetInfo) => {
                        if (
                            assetInfo.names &&
                            assetInfo.originalFileNames.some((name) =>
                                name.startsWith('src/assets/templates/')
                            )
                        ) {
                            return 'assets/[name][extname]';
                        }
                        return 'assets/[name]-[hash][extname]';
                    },
                },
            },
        },
    };
});

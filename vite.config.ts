import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [vue()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_AGENT_API_URL || 'http://localhost:8010',
          changeOrigin: true,
        },
      },
    },
  };
});

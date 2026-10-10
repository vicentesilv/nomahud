import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // El proxy corre DENTRO del contenedor: debe apuntar al servicio backend (app:3000).
  // Para `npm run dev` fuera de Docker, definir VITE_PROXY_TARGET=http://localhost:3001 en frontend/.env
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://app:3000'

  return {
    plugins: [
      react(),
      {
        name: 'cjs-shim',
        transform(code, id) {
          if (id.includes('mammoth.browser.js')) {
            return {
              code: `
var module = { exports: {} };
var exports = module.exports;
${code}
export default module.exports;
`,
              map: null,
            }
          }
        },
      },
    ],
    optimizeDeps: {
      exclude: ['mammoth', 'xlsx'],
    },
    server: {
      allowedHosts: ['localhost', '127.0.0.1'],
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})

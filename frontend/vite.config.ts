import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001'

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
      allowedHosts: true,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})

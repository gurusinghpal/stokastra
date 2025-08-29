import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/tvapi': {
        target: 'https://scanner.tradingview.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/tvapi/, ''),
        secure: false,
      }
    }
  }
})

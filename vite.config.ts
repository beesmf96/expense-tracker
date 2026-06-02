import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  base: '/expense-tracker/',
  plugins: [preact()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
})

import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  base: '/expense-tracker/',
  plugins: [preact()],
  test: {
    environment: 'happy-dom',
    globals: true,
  },
})

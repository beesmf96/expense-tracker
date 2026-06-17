import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  base: '/expense-tracker/',
  plugins: [preact()],
  server: { host: 'localhost', strictPort: true },
  preview: { host: 'localhost', strictPort: true },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test-utils/**', 'src/types/**'],
    },
  },
})

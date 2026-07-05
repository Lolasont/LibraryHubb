import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuracion del bundler Vite para el frontend React.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})

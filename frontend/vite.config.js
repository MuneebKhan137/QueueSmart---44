import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // the backend only allows http://localhost:5173, so fail loudly instead of drifting to 5174
  server: { port: 5173, strictPort: true },
})

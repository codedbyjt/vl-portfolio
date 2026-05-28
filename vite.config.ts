import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const useTunnelHmr = process.env.VITE_TUNNEL_HMR === 'true'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/vl-portfolio/' : '/',
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': '/src',
    },
  },
  server: {
    allowedHosts: ['.loca.lt'],
    ...(useTunnelHmr
      ? {
          hmr: {
            protocol: 'wss',
            clientPort: 443,
          },
        }
      : {}),
  },
}))

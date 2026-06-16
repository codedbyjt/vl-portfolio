import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const useTunnelHmr = process.env.VITE_TUNNEL_HMR === 'true'

function mediaUsageDevPlugin(): Plugin {
  return {
    name: 'media-usage-dev',
    configureServer(server) {
      server.middlewares.use('/api/media-usage/refresh', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const env = loadEnv('', process.cwd(), '')
        const cloudName = env.CLOUDINARY_CLOUD_NAME ?? env.VITE_CLOUDINARY_CLOUD_NAME
        const apiKey = env.CLOUDINARY_API_KEY
        const apiSecret = env.CLOUDINARY_API_SECRET

        res.setHeader('Content-Type', 'application/json')

        if (!cloudName || !apiKey || !apiSecret) {
          res.statusCode = 400
          res.end(
            JSON.stringify({
              error:
                'Missing Cloudinary Admin API settings. Add CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to .env.local.',
            }),
          )
          return
        }

        try {
          const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/usage`,
            {
              headers: {
                Authorization: `Basic ${auth}`,
              },
            },
          )

          const usage = await response.json()

          if (!response.ok) {
            res.statusCode = response.status
            res.end(
              JSON.stringify({
                error: usage?.error?.message ?? 'Cloudinary usage refresh failed.',
              }),
            )
            return
          }

          const snapshot = {
            source: 'cloudinary',
            checked_at: new Date().toISOString(),
            ...usage,
          }
          const filePath = path.join(process.cwd(), 'public', 'media-usage.json')

          await mkdir(path.dirname(filePath), { recursive: true })
          await writeFile(filePath, `${JSON.stringify(snapshot, null, 2)}\n`)

          res.end(JSON.stringify(snapshot))
        } catch (error) {
          res.statusCode = 500
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            }),
          )
        }
      })
    },
  }
}

function customDomainPlugin(domain: string): Plugin {
  return {
    name: 'custom-domain-cname',
    closeBundle: async () => {
      await mkdir('dist', { recursive: true })
      await writeFile(path.join('dist', 'CNAME'), `${domain}\n`)
    },
  }
}

export function createPortfolioViteConfig(buildBase: string, customDomain?: string) {
  return defineConfig(({ command }) => ({
    base: command === 'build' ? buildBase : '/',
    plugins: [
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
      ...(command === 'serve' ? [mediaUsageDevPlugin()] : []),
      ...(command === 'build' && customDomain
        ? [customDomainPlugin(customDomain)]
        : []),
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
}

export default createPortfolioViteConfig('/', 'www.viclentaigne.com')

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'

  return {
    plugins: [react()],
    appType: 'spa', // Ensures SPA fallback for all routes
    server: {
      proxy: {
        '/api': 'http://localhost:5001',
        '/admin/': 'http://localhost:5001', // Proxy subpaths of /admin to backend
        // Proxy auth endpoints so client-side calls to /auth/* reach the backend
        '/auth': 'http://localhost:5001'
      },
      fs: { strict: false },
      historyApiFallback: true,
      // Only send a restrictive CSP in production builds. In development we avoid
      // setting connect-src so local API calls to http://localhost:5001 are not blocked.
      ...(isProd
        ? {
            headers: {
              'Content-Security-Policy': "connect-src 'self' http://localhost:5173 http://localhost:5001"
            }
          }
        : {})
    }
  }
})
import type { NextConfig } from 'next'

// En el VPS, Traefik manda /api, /uploads y /admin directo al backend y
// estas reglas no se usan. Sirven para correr el frontend sin Traefik
// (docker-compose.local.yml o `npm run dev`): Next reenvía esas rutas al
// backend. Se evalúan al compilar, por eso API_INTERNAL_URL es build arg.
const backend = process.env.API_INTERNAL_URL || 'http://backend:4000'

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backend}/api/:path*` },
      { source: '/uploads/:path*', destination: `${backend}/uploads/:path*` },
    ]
  },
}

export default nextConfig

import type { NextConfig } from 'next';

// Cabeceras de seguridad. La CSP se construye por partes para que se pueda leer
// y para dejar dicho por qué está cada excepción: una CSP en una sola línea
// acaba siendo intocable porque nadie se atreve a saber qué rompe.
//
// `connect-src` tiene que incluir el proyecto de Supabase (API y realtime). Hasta
// que exista el proyecto se deja el comodín de supabase.co; cuando esté creado,
// se estrecha al origen concreto con NEXT_PUBLIC_SUPABASE_URL.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://*.supabase.co';
const enDesarrollo = process.env.NODE_ENV === 'development';

const csp = [
  "default-src 'self'",
  // 'unsafe-eval' solo en desarrollo: lo necesita el refresco en caliente.
  `script-src 'self' 'unsafe-inline'${enDesarrollo ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabase} ${supabase.replace('https://', 'wss://')}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const cabeceras = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: cabeceras }];
  },
};

export default nextConfig;

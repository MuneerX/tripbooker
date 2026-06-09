
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent the page from being embedded in iframes (clickjacking protection)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Force HTTPS for 1 year (HSTS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Control referrer information sent with requests
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Disable browser features that are not needed
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content Security Policy - controls which resources can be loaded
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Allow scripts from self + inline scripts needed by Next.js
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Allow styles from self, inline styles, and Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Allow fonts from self and Google Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Allow images from self + all explicitly allowed image domains + OpenStreetMap & Leaflet markers
              "img-src 'self' data: blob: https://ipuruidnljuolifndokh.supabase.co https://i.ibb.co https://placehold.co https://images.unsplash.com https://picsum.photos https://tour-locations.s3.amazonaws.com https://*.tile.openstreetmap.org https://unpkg.com",
              // Allow connections to Supabase and self
              "connect-src 'self' https://ipuruidnljuolifndokh.supabase.co wss://ipuruidnljuolifndokh.supabase.co",
              // Allow leaflet CSS from unpkg
              "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
              "script-src-elem 'self' 'unsafe-inline' https://unpkg.com",
              // Restrict frame sources
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      // Primary Supabase storage bucket
      {
        protocol: 'https',
        hostname: 'ipuruidnljuolifndokh.supabase.co',
        port: '',
        pathname: '/**',
      },
      // Placeholder images used in development/testing
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Unsplash stock images
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Picsum placeholder images
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // ImgBB hosted images (logo, login banner)
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      // Tour locations S3 bucket
      {
        protocol: 'https',
        hostname: 'tour-locations.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
};

export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sobrecupos-medical-images.s3.us-east-2.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
      },
    ],
  },
  // Configuración para AWS SDK
  experimental: {
    serverComponentsExternalPackages: ['@aws-sdk/client-s3'],
  },
}

module.exports = nextConfig
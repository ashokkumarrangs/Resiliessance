/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.68.112', '192.168.68.56', '192.168.68.116', '192.168.0.115', '192.168.68.121', '192.168.68.86', 'localhost:3000'],
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  async redirects() {
    return [
      {
        source: '/expenses',
        destination: '/finance',
        permanent: true,
      },
      {
        source: '/expenses/:path*',
        destination: '/finance/:path*',
        permanent: true,
      },
    ];
  },
}

export default nextConfig

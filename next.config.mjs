/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow larger request bodies for PDF uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;

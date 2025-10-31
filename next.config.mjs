/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: "images.unsplash.com",
      },
    ],
  },
  // cacheComponents: true, // Disabled due to incompatibility with dynamic routes
  experimental: {
    viewTransition: true,
  },
}

export default nextConfig

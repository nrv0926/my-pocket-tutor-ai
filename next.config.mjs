/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Server actions are stable in 14.x; explicit flag here for clarity.
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
};

export default nextConfig;

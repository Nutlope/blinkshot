/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.together.ai",
      },
    ],
  },
};

export default nextConfig;

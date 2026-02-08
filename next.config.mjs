/** @type {import("next").NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
    outputFileTracingIncludes: {
      "/api/**": [
        "./node_modules/.prisma/client/**",
      ],
    },
  },
};

export default nextConfig;

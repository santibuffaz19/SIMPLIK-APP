import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // Esto permite subir logos y fotos de hasta 5 Megabytes
    },
  },
};

export default nextConfig;
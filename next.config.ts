import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // Subido a 50mb para soportar sesiones IA de alta calidad y múltiples fotos
    },
  },
};

export default nextConfig;
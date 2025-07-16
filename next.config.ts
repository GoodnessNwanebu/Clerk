import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development"
})({
  reactStrictMode: true,
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  eslint: {
    ignoreDuringBuilds: true, // We'll fix these later
  },
  optimizeFonts: true,
  turbopack: {
    // Turbopack specific options
  }
});

export default nextConfig;

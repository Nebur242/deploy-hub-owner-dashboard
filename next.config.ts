import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "storage.googleapis.com",
      // Include any other external domains you need for images
    ],
    // Optional: If you're using Firebase's default URL format which includes a longer path
    // that includes your project ID, you might also need to add:
    // 'storage.cloud.google.com',
  },
};

export default nextConfig;

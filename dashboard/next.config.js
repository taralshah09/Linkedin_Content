/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow larger request bodies for the DB-upload API (base64 images).
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

module.exports = nextConfig;

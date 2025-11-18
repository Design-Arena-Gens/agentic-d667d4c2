/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-app-builder',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  },
}

module.exports = nextConfig

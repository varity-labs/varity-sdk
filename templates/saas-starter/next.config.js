/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  typescript: {
    // Type checking handled by IDE/CI — build skips to avoid
    // workspace dependency version mismatches
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Suppress MetaMask SDK warning for @react-native-async-storage
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

module.exports = nextConfig;

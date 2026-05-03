/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  productionBrowserSourceMaps: false,
  webpack: (config, { isServer, dev }) => {
    // Suppress unused optional peer dependencies from UI Kit internals
    ['@react-native-async-storage/async-storage', 'viem', 'viem/chains', 'thirdweb', 'thirdweb/chains', 'thirdweb/react', 'thirdweb/deploys', 'thirdweb/storage', 'thirdweb/wallets', 'thirdweb/wallets/in-app', 'thirdweb/extensions/erc20', 'wagmi', '@solana/kit', '@solana/sysvars', '@solana-program/token-2022', 'x402', '@coinbase/wallet-sdk', '@walletconnect/ethereum-provider'].forEach(pkg => { config.resolve.alias[pkg] = false; });
    if (!dev && !isServer) config.devtool = false;
    return config;
  },
};

module.exports = nextConfig;

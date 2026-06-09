import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript:{
    ignoreBuildErrors:true
  },
  turbopack:{
    root:path.join(__dirname, '..'),
  },
  // transpilePackages: ['@uiw/react-mac-keyboard'],
};

export default nextConfig;

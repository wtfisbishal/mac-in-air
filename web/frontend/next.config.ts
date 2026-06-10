import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript:{
    ignoreBuildErrors:true
  },
  images:{
    remotePatterns:[
      {
        protocol:'https',
        hostname:'s3.macosicons.com',
        port:'',
        pathname:'/**'
      },
       {
        protocol:'https',
        hostname:'cdn.jim-nielsen.com',
        port:'',
        pathname:'/**'
      }
    ]
  },
  turbopack:{
    root:path.join(__dirname, '..'),
  },
  // transpilePackages: ['@uiw/react-mac-keyboard'],
};

export default nextConfig;

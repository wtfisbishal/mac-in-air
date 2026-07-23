import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
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
      },
          {
        protocol:'https',
        hostname:'s3-new.macosicons.com',
        port:'',
        pathname:'/**'
      }
    ]
  },
  // allowedDevOrigins: ['172.20.10.8'],
  turbopack:{
    root:path.join(__dirname, '..'),
  },
  // transpilePackages: ['@uiw/react-mac-keyboard'],
};

export default nextConfig;

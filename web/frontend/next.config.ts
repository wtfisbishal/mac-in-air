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
      },
    {
        protocol:'https',
        hostname:'lh3.googleusercontent.com',
        port:'',
        pathname:'/**'
      }
    ]
  },
  allowedDevOrigins: ['192.0.0.2','127.0.0.1'],
  turbopack:{
    root:path.join(__dirname, '..'),
  },
  // transpilePackages: ['@uiw/react-mac-keyboard'],
};

export default nextConfig;

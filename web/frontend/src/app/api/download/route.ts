 
import { NextResponse } from "next/server";

export async function GET() {
    const assetId = process.env.GITHUB_ASSET_ID!;  
    const owner = process.env.GITHUB_OWNER!;
    const repo = process.env.GITHUB_REPO!;
    
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/assets/${assetId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        Accept: "application/octet-stream",
      },
      redirect: "manual",
    }
  );
 
  const location = response.headers.get("location");
 
  if (!location) {
    const body = await response.text();

    return NextResponse.json({
      status: response.status,
      body,
    });
  }

  return NextResponse.redirect(location);
}

 
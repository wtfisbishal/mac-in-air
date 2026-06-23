import { NextResponse } from "next/server";

export async function GET() {
  const owner = process.env.GITHUB_OWNER!;
  const repo = process.env.GITHUB_REPO!;
  const token = process.env.GH_TOKEN!;
  const assetName = "mac-in-air-arm64.dmg" ;  

  const releaseRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    }
  );

  if (!releaseRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch latest release" },
      { status: releaseRes.status }
    );
  }

  const release = await releaseRes.json();

  const asset = release.assets.find(
    (a: { name: string }) => a.name === assetName
  );

  if (!asset) {
    return NextResponse.json(
      { error: `Asset '${assetName}' not found in latest release` },
      { status: 404 }
    );
  }

  const assetRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/assets/${asset.id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/octet-stream",
      },
      redirect: "manual",
    }
  );

  const location = assetRes.headers.get("location");

  if (!location) {
    return NextResponse.json(
      {
        error: "GitHub did not return a download URL",
        status: assetRes.status,
        body: await assetRes.text(),
      },
      { status: assetRes.status }
    );
  }

  return NextResponse.redirect(location);
}
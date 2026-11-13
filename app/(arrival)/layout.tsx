import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { LINK_PREVIEW } from "@/client/arrival/content";
import "./arrival.css";

// The Arrival page is its own root layout, so a player's phone gets none of the
// main app's code or styles. The link preview is the same for every player:
// nothing about who the link is for.

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = { url: "/arrival/og.jpg", width: 1200, height: 630, alt: "A candle-lit window in the fog" };
  return {
    metadataBase: new URL(`${proto}://${host}`),
    title: LINK_PREVIEW.title,
    description: LINK_PREVIEW.description,
    robots: { index: false, follow: false },
    openGraph: { type: "website", title: LINK_PREVIEW.title, description: LINK_PREVIEW.description, siteName: LINK_PREVIEW.title, images: [image] },
    twitter: { card: "summary_large_image", title: LINK_PREVIEW.title, description: LINK_PREVIEW.description, images: [image.url] },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#03050a",
};

export default function ArrivalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}

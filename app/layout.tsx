import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Caveat, Figtree } from "next/font/google";
import { site } from "@/lib/content";
import "./globals.css";

// Headings: a friendly grotesque, used slightly condensed.
const head = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-head",
});

// Body text.
const body = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
});

// One handwritten accent (photo caption, little notes).
const hand = Caveat({
  weight: "600",
  subsets: ["latin"],
  variable: "--font-hand",
});

const description = `${site.name}: computer science student at UIT, Yangon, building full-stack web apps and games, and heading into machine learning and AI engineering.`;

// The share image and icons come from files in app/ (opengraph-image.jpg, twitter-image.jpg,
// icon.svg, apple-icon.png, favicon.ico); Next.js adds their tags.
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.name} · Portfolio`,
  description,
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title: `${site.name} · Portfolio`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} · Portfolio`,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#8c3f27",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${head.variable} ${body.variable} ${hand.variable}`}>
      <body>{children}</body>
    </html>
  );
}

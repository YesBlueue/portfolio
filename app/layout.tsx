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

export const metadata: Metadata = {
  title: `${site.name} · Portfolio`,
  description: `${site.name}: computer science student at UIT, Yangon, building full-stack web apps, hardware prototypes and games.`,
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

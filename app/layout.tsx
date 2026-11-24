import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Sans, Press_Start_2P } from "next/font/google";
import { site } from "@/lib/content";
import { TITLE_SEEN_KEY } from "@/lib/title";
import "./globals.css";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

// Squared-off, game-UI feel but readable at small sizes (menus, labels, buttons).
const ui = Chakra_Petch({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ui",
});

const body = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: `${site.name} · Portfolio`,
  description: `${site.name}: computer science student at UIT, Yangon, building full-stack web apps, hardware prototypes and games.`,
};

export const viewport: Viewport = {
  themeColor: "#0d0816",
  viewportFit: "cover",
};

// Runs before first paint: skip the title screen for returning visitors
// and for links that jump straight to a section.
const titleScript = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  TITLE_SEEN_KEY,
)})||location.hash)document.documentElement.setAttribute("data-title","seen")}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pixel.variable} ${ui.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: titleScript }} />
        <noscript>
          <style>{`[data-title-screen]{display:none!important}body{overflow:auto!important}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}

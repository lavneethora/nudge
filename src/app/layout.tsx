import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Open-font stand-ins for virio's Haffer XH SemiMono (commercial, unlicensed).
// Geist Mono is visually closest; IBM Plex Mono is the loaded fallback.
// Both ship a real 500 weight, which the hero typography needs.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const TITLE = "Nudge - Never get charged for a trial you forgot";
const DESCRIPTION =
  "A text message assistant that watches your inbox and reminds you before trials end. No app to download.";

export const metadata: Metadata = {
  // Lets every OG/Twitter image below be declared as a relative path and still
  // render as an absolute URL — so pointing at a real domain stays a one-line
  // env change rather than a hunt for hardcoded links.
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Nudge",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    // The title card from the demo video — a real asset, not a stock shot.
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "Nudge",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

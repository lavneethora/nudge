import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Mono } from "next/font/google";
import Footer from "@/components/landing/Footer";
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

export const metadata: Metadata = {
  title: "Nudge - Never get charged for a trial you forgot",
  description:
    "A text message assistant that watches your inbox and reminds you before trials end. No app to download.",
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
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}

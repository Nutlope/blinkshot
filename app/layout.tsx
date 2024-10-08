import Providers from "@/app/providers";
import bgPattern from "@/public/bg-pattern-transparent.png";
import type { Metadata } from "next";
import PlausibleProvider from "next-plausible";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

let title = "BlinkShot – Real-Time AI Image Generator";
let description = "Generate images with AI in a milliseconds";
let url = "https://www.blinkshot.io/";
let ogimage = "https://www.blinkshot.io/og-image.png";
let sitename = "blinkshot.io";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url: url,
    siteName: sitename,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: [ogimage],
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="color-scheme" content="dark" />
        <PlausibleProvider domain="blinkshot.io" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} dark h-full min-h-full bg-[length:6px] font-mono text-gray-100 antialiased`}
        style={{ backgroundImage: `url(${bgPattern.src}` }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

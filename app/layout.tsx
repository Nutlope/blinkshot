import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import bgPattern from "@/public/bg-pattern-transparent.png";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  // weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  // weight: "100 500 900",
});

let title = "Blinkshot – AI Image Playground";
let description = "Generate images with AI in a blink";
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} dark h-full min-h-full bg-[length:6px] font-mono text-gray-100 antialiased`}
        style={{ backgroundImage: `url(${bgPattern.src}` }}
      >
        {children}
      </body>
    </html>
  );
}

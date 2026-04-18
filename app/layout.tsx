import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display, Dancing_Script } from "next/font/google";
import BottomNavClient from "@/components/BottomNavClient";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "900"],
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Prettied by Mel",
  description: "Nail appointments & client management for Prettied by Mel",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Prettied by Mel",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${playfair.variable} ${dancing.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] select-none">
        <ServiceWorkerRegistrar />
        <div className="flex-1 pb-16">
          {children}
        </div>
        <BottomNavClient />
      </body>
    </html>
  );
}

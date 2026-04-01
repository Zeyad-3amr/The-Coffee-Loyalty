import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { NavbarWrapper } from "./components/NavbarWrapper";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Brew | Premium Digital Coffee Loyalty",
  description: "Digital loyalty program for independent coffee shops. Premium experience, no apps required.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-950 text-stone-100 min-h-screen flex flex-col`}
      >
        <NavbarWrapper />
        <main className="flex-1 flex flex-col relative">
          <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex-1">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

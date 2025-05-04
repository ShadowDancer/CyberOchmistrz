import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from 'next/link';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cybernetyczny Ochmistrz",
  description: "Aplikacja pomagająca w przygotowaniu zaopatrzenia na rejsach.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="border-b">
          <div className="container mx-auto py-4 px-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-lg font-bold">
                Cybernetyczny Ochmistrz
              </Link>
              <div className="flex gap-6">
                <Link href="/przepisy" className="hover:text-blue-600">
                  Przepisy
                </Link>
                <Link href="/rejsy" className="hover:text-blue-600">
                  Rejsy
                </Link>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}

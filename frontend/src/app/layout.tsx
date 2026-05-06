import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "@/components/AppToaster";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { GoogleProviders } from "@/components/GoogleProviders";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShopOne",
  description: "Single-store e-commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-textMain">
        <GoogleProviders>
          <Navbar />
          <div className="print:hidden">
            <AppToaster />
          </div>
          <div className="flex min-h-0 flex-1 flex-col print:bg-white">{children}</div>
          <Footer />
          <div className="print:hidden">
            <ChatbotWidget />
          </div>
        </GoogleProviders>
      </body>
    </html>
  );
}

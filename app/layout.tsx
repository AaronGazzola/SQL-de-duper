import Sidebar from "@/components/Sidebar";

import Provider from "@/store/Provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  title: "SQL Migration Parser",
  description: "Tool for parsing and organizing SQL statements",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex h-screen overflow-hidden`}
      >
        <Provider>
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
          <Toaster
            toastOptions={{
              style: {
                background: "transparent",
                border: "none",
                padding: 0,
                boxShadow: "none",
                justifyContent: "end",
              },
            }}
          />
        </Provider>
      </body>
    </html>
  );
}

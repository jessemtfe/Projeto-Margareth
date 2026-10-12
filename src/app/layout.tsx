import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from "./components/app-shell";
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
  title: "EcoCat",
  description: "Sistema de rateio para a cooperativa de reciclagem EcoCat.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f3f5f1] text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

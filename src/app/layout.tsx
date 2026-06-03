import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Stokbarang Umatis - Bar Inventory & Stock Opname",
  description: "Aplikasi Manajemen Inventaris Bar dan Stock Opname Umatis Resto & Venue. Didesain secara eksklusif untuk operasional bar modern, pelacakan transaksi, dan audit stock opname.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-slate-100 selection:bg-emerald-800 selection:text-emerald-100">
        {children}
      </body>
    </html>
  );
}

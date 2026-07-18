import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BookingProvider } from "@/context/BookingContext";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getPublicSiteUrl } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nimman Foto | จองคิวออนไลน์",
    template: "%s | Nimman Foto",
  },
  description:
    "จองคิวถ่ายภาพวันสำคัญ รับปริญญา รับทรานสคริป และจบพยาบาล เลือกวันและรอบว่างได้ทันที",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: "/",
    siteName: "Nimman Foto",
    title: "Nimman Foto | จองคิวออนไลน์",
    description:
      "รับปริญญา · รับทรานสคริป · จบพยาบาล เลือกวันและรอบว่างได้ทันที",
    images: [
      {
        url: "/nimman-foto-booking-share.png",
        width: 1773,
        height: 909,
        alt: "Nimman Foto - จองคิวถ่ายภาพวันสำคัญ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nimman Foto | จองคิวออนไลน์",
    description:
      "รับปริญญา · รับทรานสคริป · จบพยาบาล เลือกวันและรอบว่างได้ทันที",
    images: ["/nimman-foto-booking-share.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BookingProvider>{children}</BookingProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

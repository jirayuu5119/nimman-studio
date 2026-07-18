import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { BookingProvider } from "@/context/BookingContext";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getPublicSiteUrl } from "@/lib/site-url";

const lineSeedSansTh = localFont({
  src: [
    {
      path: "./fonts/LINESeedSansTH-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/LINESeedSansTH-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/LINESeedSansTH-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/LINESeedSansTH-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/LINESeedSansTH-Heavy.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-line-seed-sans-th",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
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
      className={`${lineSeedSansTh.variable} ${lineSeedSansTh.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BookingProvider>{children}</BookingProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

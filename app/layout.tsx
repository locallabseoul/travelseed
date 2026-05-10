import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://travelseed.vercel.app"),
  title: "Travelseed",
  description: "Direct booking websites for resorts and villas.",
  openGraph: {
    title: "Travelseed",
    description: "Direct booking websites for resorts and villas.",
    type: "website",
    siteName: "Travelseed",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

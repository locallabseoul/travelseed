import type { Metadata } from "next";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://travelseed.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

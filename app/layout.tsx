import type { Metadata } from "next";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://travelseed.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Travelseed",
  description: "WhatsApp-first AI website builder for Indonesian hospitality and local commerce.",
  openGraph: {
    title: "Travelseed",
    description: "WhatsApp-first AI website builder for Indonesian hospitality and local commerce.",
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

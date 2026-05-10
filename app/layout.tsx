import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travelseed",
  description: "Direct booking websites for resorts and villas.",
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

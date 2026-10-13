import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { siteDescription, siteTitle } from "./site-config";

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: `%s｜島ップ`,
  },
  description: siteDescription,
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  alternates: { canonical: "/" },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "島ップ",
    title: siteTitle,
    description: siteDescription,
    images: [{ url: "/og-image.jpg", width: 1600, height: 840, alt: "海と集落のある日本の島の風景" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <a className="skip-link" href="#main-content">本文へ移動</a>
        {children}
      </body>
    </html>
  );
}

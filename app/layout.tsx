import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Providers } from "@/components/providers";
import { site, personJsonLd } from "@/app/_site/site-config";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

// All SEO/brand text is sourced from app/_site/site-config.ts — edit it there.
export const metadata: Metadata = {
  metadataBase: new URL(site.baseUrl),
  title: {
    default: site.title.default,
    template: site.title.template,
  },
  description: site.description,
  appleWebApp: {
    title: site.manifest.shortName,
  },
  openGraph: {
    title: site.openGraph.title,
    description: site.openGraph.description,
    siteName: site.openGraph.siteName,
    locale: site.openGraph.locale,
    type: site.openGraph.type,
    ...(site.openGraph.image ? { images: [site.openGraph.image] } : {}),
  },
  twitter: {
    card: site.twitter.image ? "summary_large_image" : "summary",
    title: site.twitter.title,
    description: site.twitter.description,
    ...(site.twitter.image ? { images: [site.twitter.image] } : {}),
  },
  robots: {
    index: true,
    follow: true,
  },
  // Bing needs an explicit, plain <link rel="icon"> pointing at /favicon.ico — it does
  // not reliably guess the root path the way Google does. The file convention
  // (app/favicon.ico) emitted a fingerprinted href, /favicon.ico?favicon.4c0b4984.ico,
  // declared as sizes="48x48" only, even though the ICO carries 16/32/48. Bing
  // recommends 32×32, so a 48-only declaration invites it to skip the file. The ICO
  // now lives in public/, so this href is stable and unhashed.
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { url: '/icon0.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icon1.png', type: 'image/png', sizes: '64x64' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* suppressHydrationWarning: browser extensions (e.g. Grammarly) inject
          data-gr-* attributes onto <body> before React hydrates, which would
          otherwise log a hydration mismatch. Only suppresses <body>'s own attrs. */}
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          geistMono.variable
        )}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />

        <Providers>
          <main className="relative flex min-h-screen flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

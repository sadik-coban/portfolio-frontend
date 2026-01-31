import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// Base URL tanımı
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sadikcoban.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Sadık Çoban | Data Scientist Portfolio",
    template: "%s | Sadık Çoban",
  },
  description: "Personal portfolio of Sadık Çoban. Showcasing projects in Artificial Intelligence, Data Science, MLOps end to end systems, and technology blog.",
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "Sadık Çoban Portfolio",
    description: "Explore my Artificial Intelligence and Data Science projects.",
    url: baseUrl,
    siteName: "Sadık Çoban",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  // İleride Google Search Console doğrulaması için burayı kullanabilirsin
  verification: {
    google: "google-site-verification-kodu-buraya-gelecek",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Sadık Çoban',
    url: baseUrl,
    jobTitle: 'Data Scientist',
    description: 'Specializing in Artificial Intelligence, Data Science, and MLOps.',
    worksFor: {
      '@type': 'Organization',
      name: 'Freelance / Open to Work'
    },
    sameAs: [
      'https://github.com/sadik-coban',
      'https://www.linkedin.com/in/sad%C4%B1k-%C3%A7oban-5239aa253',
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable
      )}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
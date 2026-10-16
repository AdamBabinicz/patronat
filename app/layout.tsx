// app/layout.tsx
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import ScrollToTop from "@/components/ScrollToTop";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://patronat.vercel.app");

const siteTitle = "PatronAI: Mecenat Klubu UKS Roszada Radom z PayPal";
const siteDescription =
  "Platforma mecenatu sportu UKS Roszada Radom. Wybierz cel, wesprzyj klub szachowy przez PayPal i odbierz oficjalny, weryfikowalny certyfikat mecenasa.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  generator: "PatronAI",
  applicationName: "PatronAI",
  authors: [{ name: "UKS Roszada Radom" }],
  keywords: [
    "PatronAI",
    "UKS Roszada Radom",
    "mecenat szachowy",
    "sponsor klubu",
    "szachy Radom",
    "mikrodarowizny",
    "PayPal sponsor",
    "certyfikat mecenasa",
  ],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      {
        url: "/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        url: "/favicon.ico",
        sizes: "any",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "PatronAI",
    locale: "pl_PL",
    type: "website",
    images: [
      {
        url: "/PatronAI.png",
        width: 1200,
        height: 630,
        alt: "PatronAI - UKS Roszada Radom",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0c0c" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SportsClub",
      "@id": `${siteUrl}/#organization`,
      name: "UKS Roszada Radom",
      sport: "Szachy / Chess",
      description:
        "Klub szachowy UKS Roszada Radom - szkolenie dzieci i młodzieży oraz organizacja turniejów.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Radom",
        addressCountry: "PL",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      name: "PatronAI",
      applicationCategory: "FinanceApplication",
      operatingSystem: "All",
      description:
        "Platforma agentic commerce łącząca kluby młodzieżowe z mecenasami poprzez weryfikowalne cele i certyfikaty.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        {/* 1. Domyślny stan zgody Google Consent Mode v2 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'wait_for_update': 500
              });
            `,
          }}
        />

        {/* 2. Błyskawiczny skrypt motywu (zapobiega migotaniu) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem('patronai_theme');
                  const isDark = saved ? saved === 'dark' : true;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />

        {/* 3. Dane strukturalne Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      </head>
      <body className="antialiased">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-N28W64VW"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {children}
        <ScrollToTop />
        {process.env.NODE_ENV === "production" && <Analytics />}

        {/* Ładowanie GTM w trybie lazyOnload – uwalnia główny wątek CPU dla natychmiastowego LCP! */}
        <Script
          id="google-tag-manager"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-N28W64VW');
            `,
          }}
        />
      </body>
    </html>
  );
}

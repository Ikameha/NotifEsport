import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import Header from "@/components/header";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'NotifEsport - Suivez vos matchs eSport préférés',
    template: '%s | NotifEsport'
  },
  description: 'Recevez des rappels personnalisés pour les matchs eSport de League of Legends et Valorant. Ne ratez plus aucun match important !',
  keywords: ['esport', 'notifications', 'match', 'League of Legends', 'Valorant', 'calendrier', 'e-sport', 'jeu vidéo', 'LOL', 'LEC', 'LFL'],
  authors: [{ name: 'Votre Nom', url: 'https://notifesport.fr' }],
  creator: 'Votre Nom',
  publisher: 'Votre Société',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://notifesport.fr'),
  alternates: {
    canonical: '/',
    languages: {
      'fr-FR': '/fr-FR',
    },
  },
  openGraph: {
    title: 'NotifEsport - Suivez vos matchs eSport préférés',
    description: 'Recevez des rappels personnalisés pour les matchs eSport de League of Legends et Valorant',
    url: 'https://notifesport.fr',
    siteName: 'NotifEsport',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg', // Créez cette image (1200x630px)
        width: 1200,
        height: 630,
        alt: 'NotifEsport - Suivez vos matchs eSport préférés',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NotifEsport - Suivez vos matchs eSport préférés',
    description: 'Recevez des rappels personnalisés pour les matchs eSport de League of Legends et Valorant',
    creator: '@votrecompte',
    images: ['/images/twitter-image.jpg'], // Créez cette image (1200x600px)
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  themeColor: '#ffffff',
  generator: 'Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        {/* Google Analytics 4 */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-V7YW54TEBB"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-V7YW54TEBB', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body className={`${inter.className} bg-light text-dark min-h-screen flex flex-col`}>
        <AuthProvider>
          <Header />
          <main className="flex-grow">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

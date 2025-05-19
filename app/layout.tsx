import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./providers";
import Header from "@/components/header";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NotifSport - Suivez vos matchs eSport préférés",
  description:
    "Recevez des rappels personnalisés pour les matchs eSport de League of Legends et Valorant",
  generator: "v0.dev",
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

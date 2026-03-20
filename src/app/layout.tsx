import type {Metadata} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import { LanguageProvider } from '@/components/language-context';

export const metadata: Metadata = {
  title: 'AffiliateSync | Empowering Affiliates Everywhere',
  description: 'Manage your digital products and affiliate commissions seamlessly with AffiliateSync.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
        <LanguageProvider>
          {children}
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}

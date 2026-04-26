import type {Metadata, Viewport} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import { LanguageProvider } from '@/components/language-context';
import { FirebaseClientProvider } from '@/firebase';
import { FloatingContact } from '@/components/floating-contact';
import { ThemeProvider } from '@/components/theme-context';

export const revalidate = 0;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

/**
 * Metadatos globales de la aplicación.
 * Se fuerza el uso del logotipo de la flama como favicon oficial.
 */
export const metadata: Metadata = {
  title: 'Sync Connect | Tecnología Elite de Nicaragua',
  description: 'Sistema propietario de gestión comercial y logística local de alto rendimiento. Sync Connect Core Engine.',
  metadataBase: new URL('https://syncconnect.ni'),
  icons: {
    icon: [
      { url: 'https://firebasestorage.googleapis.com/v0/b/studio-9886993662-50a10.firebasestorage.app/o/site_assets%2Fsite-logo_1740683076891?alt=media&token=866c1b35-86f7-49f3-8f0a-f0f1b2b8e3a2&v=final-1', type: 'image/png' },
    ],
    shortcut: 'https://firebasestorage.googleapis.com/v0/b/studio-9886993662-50a10.firebasestorage.app/o/site_assets%2Fsite-logo_1740683076891?alt=media&token=866c1b35-86f7-49f3-8f0a-f0f1b2b8e3a2&v=final-1',
    apple: 'https://firebasestorage.googleapis.com/v0/b/studio-9886993662-50a10.firebasestorage.app/o/site_assets%2Fsite-logo_1740683076891?alt=media&token=866c1b35-86f7-49f3-8f0a-f0f1b2b8e3a2&v=final-1',
  },
  applicationName: 'Sync Connect Core Engine',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const faviconUrl = "https://firebasestorage.googleapis.com/v0/b/studio-9886993662-50a10.firebasestorage.app/o/site_assets%2Fsite-logo_1740683076891?alt=media&token=866c1b35-86f7-49f3-8f0a-f0f1b2b8e3a2&v=final-1";

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* INYECCIÓN MANUAL DE ALTA PRIORIDAD - SOBREESCRIBE CUALQUIER ICONO POR DEFECTO */}
        <link rel="icon" type="image/png" href={faviconUrl} />
        <link rel="shortcut icon" href={faviconUrl} />
        <link rel="apple-touch-icon" href={faviconUrl} />
        <meta name="theme-color" content="#131921" />
      </head>
      <body className="font-body antialiased bg-[#EAEDED] text-foreground transition-colors duration-300 overflow-x-hidden selection:bg-primary/20">
        <FirebaseClientProvider>
          <ThemeProvider>
            <LanguageProvider>
              {children}
              <FloatingContact />
              <Toaster />
            </LanguageProvider>
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

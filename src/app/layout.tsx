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

// URL del logotipo oficial de la marca (Flama dorada Sync)
const NEW_LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/studio-9886993662-50a10.firebasestorage.app/o/site_assets%2Fsite-logo_1740683076891?alt=media&token=866c1b35-86f7-49f3-8f0a-f0f1b2b8e3a2";
// Añadimos una versión para forzar el refresco de caché en cada despliegue
const FAVICON_URL = `${NEW_LOGO_URL}&v=final-sync-v100`;

export const metadata: Metadata = {
  title: 'Sync Connect | Tecnología Elite de Nicaragua',
  description: 'Sistema propietario de gestión comercial y logística local de alto rendimiento. Sync Connect Core Engine.',
  metadataBase: new URL('https://syncconnect.ni'),
  icons: {
    icon: [
      { url: FAVICON_URL, href: FAVICON_URL, rel: 'icon', type: 'image/png' },
    ],
    shortcut: [
      { url: FAVICON_URL, href: FAVICON_URL },
    ],
    apple: [
      { url: FAVICON_URL, href: FAVICON_URL },
    ],
  },
  applicationName: 'Sync Connect Core Engine',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Inyección manual de alta prioridad para sobreescribir cualquier favicon residual del sistema */}
        <link rel="icon" type="image/png" href={FAVICON_URL} />
        <link rel="shortcut icon" href={FAVICON_URL} />
        <link rel="apple-touch-icon" href={FAVICON_URL} />
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

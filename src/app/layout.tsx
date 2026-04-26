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
 * Se configura el favicon para que apunte directamente al logo de la plataforma.
 */
export const metadata: Metadata = {
  title: 'Sync Connect | Tecnología Elite de Nicaragua',
  description: 'Sistema propietario de gestión comercial y logística local de alto rendimiento. Sync Connect Core Engine.',
  metadataBase: new URL('https://syncconnect.ni'),
  icons: {
    icon: [
      { url: 'https://img.icons8.com/fluency/96/sync.png?v=7', type: 'image/png' },
      { url: 'https://img.icons8.com/fluency/96/sync.png?v=7', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: 'https://img.icons8.com/fluency/96/sync.png?v=7',
    apple: 'https://img.icons8.com/fluency/96/sync.png?v=7',
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
        {/* Inyección manual de alta prioridad para navegadores y motores de búsqueda */}
        <link rel="icon" type="image/png" href="https://img.icons8.com/fluency/96/sync.png?v=7" />
        <link rel="shortcut icon" href="https://img.icons8.com/fluency/96/sync.png?v=7" />
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

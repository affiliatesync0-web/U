import type {Metadata, Viewport} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import { LanguageProvider } from '@/components/language-context';
import { FirebaseClientProvider } from '@/firebase';
import { FloatingContact } from '@/components/floating-contact';
import { ThemeProvider } from '@/components/theme-context';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getGoogleDriveDirectLink } from '@/lib/utils';

export const revalidate = 0;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// NUEVA URL DEL LOGO OFICIAL (Versión Refinada para Favicon)
const OFFICIAL_SYNC_ICON = "https://img.icons8.com/fluency/96/sync.png";

export async function generateMetadata(): Promise<Metadata> {
  const { firestore } = initializeFirebase();
  let dynamicIcon = OFFICIAL_SYNC_ICON;
  
  try {
    const logoSnap = await getDoc(doc(firestore, 'site_config', 'site-logo'));
    if (logoSnap.exists() && logoSnap.data().imageUrl) {
      dynamicIcon = getGoogleDriveDirectLink(logoSnap.data().imageUrl);
    }
  } catch (e) {
    console.error("Error cargando metadatos de marca:", e);
  }

  // Cache buster para forzar al navegador a actualizar el icono
  const version = "v-final-premium-1";
  const iconUrl = `${dynamicIcon}${dynamicIcon.includes('?') ? '&' : '?'}v=${version}`;

  return {
    title: 'Sync Connect | Tecnología Elite de Nicaragua',
    description: 'Sistema propietario de gestión comercial y logística local de alto rendimiento. Sync Connect Core Engine.',
    metadataBase: new URL('https://syncconnect.ni'),
    icons: {
      icon: [{ url: iconUrl, type: 'image/png' }],
      shortcut: [iconUrl],
      apple: [{ url: iconUrl, sizes: '180x180', type: 'image/png' }],
    },
    applicationName: 'Sync Connect Core Engine',
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inyección manual con máxima prioridad en el DOM
  const manualIcon = `${OFFICIAL_SYNC_ICON}?v=refresh-manual-final-1`;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* BLOQUEO MANUAL ABSOLUTO - PRIORIDAD MÁXIMA */}
        <link rel="icon" type="image/png" href={manualIcon} />
        <link rel="shortcut icon" type="image/png" href={manualIcon} />
        <link rel="apple-touch-icon" type="image/png" href={manualIcon} />
        <meta name="msapplication-TileImage" content={manualIcon} />
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

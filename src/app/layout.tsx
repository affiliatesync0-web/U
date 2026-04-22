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

// URL DEL LOGO OFICIAL (Flama Sync Connect)
const OFFICIAL_SYNC_ICON = "https://firebasestorage.googleapis.com/v0/b/studio-9886993662-50a10.firebasestorage.app/o/site_assets%2Fsite-logo_1740011502446?alt=media";

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

  // Generamos un timestamp para forzar al navegador a limpiar el cache del favicon
  const cacheBuster = Date.now();
  const iconWithCacheBuster = `${dynamicIcon}${dynamicIcon.includes('?') ? '&' : '?'}refresh=${cacheBuster}`;

  return {
    title: 'Sync Connect | Tecnología Elite de Nicaragua',
    description: 'Sistema propietario de gestión comercial y logística local de alto rendimiento. Sync Connect Core Engine.',
    metadataBase: new URL('https://syncconnect.ni'),
    icons: {
      icon: [
        { url: iconWithCacheBuster, type: 'image/png' },
      ],
      apple: [
        { url: iconWithCacheBuster, sizes: '180x180', type: 'image/png' },
      ],
      shortcut: [iconWithCacheBuster],
    },
    applicationName: 'Sync Connect Core Engine',
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Versión estática con cache buster para inyección directa
  const staticIcon = `${OFFICIAL_SYNC_ICON}&v=${Date.now()}`;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* BLOQUEO ABSOLUTO DE FAVICON EXTERNO - INYECCIÓN DIRECTA DE ALTA PRIORIDAD */}
        <link rel="icon" type="image/png" href={staticIcon} />
        <link rel="shortcut icon" type="image/png" href={staticIcon} />
        <link rel="apple-touch-icon" type="image/png" href={staticIcon} />
        <link rel="mask-icon" href={staticIcon} color="#ff9900" />
        <meta name="theme-color" content="#131921" />
        <meta name="msapplication-TileImage" content={staticIcon} />
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

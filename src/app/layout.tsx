
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
import placeholderData from '@/app/lib/placeholder-images.json';

export const revalidate = 0;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// URL CONSTANTE DEL LOGO OFICIAL (FONDO TRANSPARENTE / DISEÑO CUADRADO)
const OFFICIAL_SYNC_ICON = "https://tse4.mm.bing.net/th?id=OIP.u_R4y8O5uF7Bv5_fN9x-fQHaHa&pid=Api";

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

  return {
    title: 'Sync Connect | Tecnología Elite de Nicaragua',
    description: 'Sistema propietario de gestión comercial y logística local de alto rendimiento. Sync Connect Core Engine.',
    metadataBase: new URL('https://syncconnect.ni'),
    icons: {
      icon: [
        { url: dynamicIcon, type: 'image/png' },
        { url: dynamicIcon, sizes: '32x32', type: 'image/png' },
        { url: dynamicIcon, sizes: '16x16', type: 'image/png' },
      ],
      apple: [
        { url: dynamicIcon, sizes: '180x180', type: 'image/png' },
      ],
      shortcut: [dynamicIcon],
    },
    applicationName: 'Sync Connect Core Engine',
    appleWebApp: {
      title: 'Sync Connect',
      statusBarStyle: 'default',
      capable: true,
    },
    other: {
      'msapplication-TileImage': dynamicIcon,
      'msapplication-TileColor': '#131921',
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* BLOQUEO ABSOLUTO DE FAVICON EXTERNO: Forzamos el logo de Sync Connect */}
        <link rel="icon" href={OFFICIAL_SYNC_ICON} />
        <link rel="shortcut icon" href={OFFICIAL_SYNC_ICON} />
        <link rel="apple-touch-icon" href={OFFICIAL_SYNC_ICON} />
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

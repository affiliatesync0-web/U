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

export async function generateMetadata(): Promise<Metadata> {
  const { firestore } = initializeFirebase();
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  
  // Icono por defecto (Sync Connect Gold)
  let iconUrl = "https://tse2.mm.bing.net/th?id=OIP.G6TzVdI0o_N-5zF2Gv9D8AHaHa&pid=Api";
  
  try {
    const logoSnap = await getDoc(doc(firestore, 'site_config', 'site-logo'));
    if (logoSnap.exists() && logoSnap.data().imageUrl) {
      iconUrl = getGoogleDriveDirectLink(logoSnap.data().imageUrl);
    } else if (defaultLogo?.imageUrl) {
      iconUrl = getGoogleDriveDirectLink(defaultLogo.imageUrl);
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
        { url: iconUrl },
        { url: iconUrl, sizes: '32x32', type: 'image/png' },
        { url: iconUrl, sizes: '16x16', type: 'image/png' },
      ],
      apple: [
        { url: iconUrl, sizes: '180x180', type: 'image/png' },
      ],
    },
    applicationName: 'Sync Connect Core Engine',
    appleWebApp: {
      title: 'Sync Connect',
      statusBarStyle: 'default',
      capable: true,
    },
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
        {/* Forzamos el favicon para eliminar cualquier rastro externo */}
        <link rel="icon" href="https://tse2.mm.bing.net/th?id=OIP.G6TzVdI0o_N-5zF2Gv9D8AHaHa&pid=Api" />
        <link rel="apple-touch-icon" href="https://tse2.mm.bing.net/th?id=OIP.G6TzVdI0o_N-5zF2Gv9D8AHaHa&pid=Api" />
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

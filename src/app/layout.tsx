
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
  
  // URL del logo por defecto del sistema
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  let iconUrl = getGoogleDriveDirectLink(defaultLogo?.imageUrl || "");
  
  try {
    const logoSnap = await getDoc(doc(firestore, 'site_config', 'site-logo'));
    if (logoSnap.exists() && logoSnap.data().imageUrl) {
      iconUrl = getGoogleDriveDirectLink(logoSnap.data().imageUrl);
    }
  } catch (e) {
    console.error("Error loading metadata icon:", e);
  }

  return {
    title: 'Sync Connect | Plataforma Elite de Afiliados',
    description: 'Gestión profesional de marketing y ventas digitales en Nicaragua. La red de afiliados más potente de la región.',
    icons: {
      icon: [
        { url: iconUrl },
      ],
      shortcut: iconUrl,
      apple: iconUrl,
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground transition-colors duration-300 overflow-x-hidden selection:bg-primary/20">
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

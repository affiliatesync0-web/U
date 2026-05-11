import type {Metadata, Viewport} from 'next';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';
import { LanguageProvider } from '@/components/language-context';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeProvider } from '@/components/theme-context';
import { FloatingContact } from '@/components/floating-contact';

export const revalidate = 0;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const FAVICON_URL = "https://scontent.fmga4-1.fna.fbcdn.net/v/t39.30808-6/666660077_122243300624253134_2093271733727861427_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=F1dEO0QGZq0Q7kNvwGU2lud&_nc_oc=AdoONEUitz3ItQ57a9wwS9h2v_ITSAuom5IOgKRog8U2RLE9eUBLbWxXdPGLPw9wT5M&_nc_zt=23&_nc_ht=scontent.fmga4-1.fna&_nc_gid=d-ZAMTuwDdRhfKDyit3fag&_nc_ss=7b289&oh=00_Af5quuYFfzIp66oolHNWOA1d-3PaBFViD3nt2qiOa1Rfxg&oe=69FA0EA1";

export const metadata: Metadata = {
  title: 'Sync Connect',
  description: 'Tecnología elite para gestión comercial.',
  icons: {
    icon: FAVICON_URL,
    apple: FAVICON_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-body antialiased bg-[#EAEDED] text-foreground selection:bg-primary/20">
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

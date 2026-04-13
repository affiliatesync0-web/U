
"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { 
  Loader2, 
  Image as ImageIcon, 
  ArrowLeft, 
  ShieldCheck,
  AlertCircle,
  LogIn
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase'
import { 
  setPersistence, 
  browserLocalPersistence, 
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { sendEmail } from '@/lib/email'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const EXTERNAL_HOME = 'https://syncacademy.systeme.io/sync-connect';

  const handleLoginSuccess = async (userEmail: string | null, uid: string) => {
    const ADMIN_EMAIL = 'affiliatesync0@gmail.com';
    
    // Alerta silenciosa de acceso para administración
    sendEmail({
      to: ADMIN_EMAIL,
      subject: '🔔 Acceso Detectado (Google)',
      text: `Usuario: ${userEmail || 'UID: ' + uid}\nMétodo: Google\nFecha: ${new Date().toLocaleString()}`
    }).catch(() => {});

    if (userEmail?.toLowerCase().trim() === ADMIN_EMAIL) {
      toast({ title: "Acceso Maestro", description: "Bienvenido al centro de mando." });
      router.push('/dashboard/admin');
    } else {
      const affSnap = await getDoc(doc(db, 'affiliates', uid));
      if (affSnap.exists()) {
        toast({ title: "Bienvenido de nuevo", description: "Sincronizando tus comisiones..." });
        router.push('/dashboard/affiliate');
      } else {
        const buyerSnap = await getDoc(doc(db, 'buyers', uid));
        if (buyerSnap.exists()) {
          toast({ title: "Hola de nuevo", description: "Accediendo a tus cursos adquiridos." });
          router.push('/dashboard/buyer');
        } else {
          toast({ title: "Sesión Iniciada", description: "Por favor, completa tu registro de perfil." });
          router.push('/auth/register');
        }
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setConfigError(null);
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      await handleLoginSuccess(result.user.email, result.user.uid);
    } catch (error: any) {
      console.error("Google Login Error:", error.code, error.message);
      let errorMsg = "No se pudo completar el acceso con Google.";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMsg = "Dominio no autorizado para Google Login.";
        setConfigError("Debes añadir este dominio en tu Consola de Firebase > Authentication > Settings > Authorized Domains.");
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMsg = "Proveedor de Google desactivado.";
        setConfigError("Habilita el método de inicio de sesión 'Google' en la sección Authentication de tu consola de Firebase.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMsg = "Ventana cerrada por el usuario.";
      }

      toast({ variant: "destructive", title: "Error Google", description: errorMsg });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 transition-colors duration-300">
      <div className="fixed top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="mb-8 text-center space-y-6">
        <Link href={EXTERNAL_HOME} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Volver a Sync Academy</span>
        </Link>

        <Link href={EXTERNAL_HOME} className="flex flex-col items-center gap-4 group transition-all">
          <div className="relative h-20 w-20 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card ring-8 ring-primary/5 flex items-center justify-center border border-border/50">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Sync Connect" width={80} height={80} className="object-contain p-3" unoptimized />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
            )}
          </div>
          <span className="font-headline font-black text-4xl text-foreground tracking-tight uppercase italic">Sync <span className="text-primary">Connect</span></span>
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-card p-2 ring-1 ring-border/50">
        <div className="bg-muted/30 rounded-[3rem] p-8 md:p-12">
          
          <CardHeader className="text-center p-0 mb-10">
            <CardTitle className="text-3xl font-headline font-black text-foreground tracking-tight leading-none uppercase italic">
              Acceso <span className="text-primary">Sync</span>
            </CardTitle>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-3">
              Identificación única con Google
            </p>
          </CardHeader>

          <CardContent className="p-0 space-y-8">
            {configError && (
              <Alert variant="destructive" className="mb-6 rounded-2xl bg-red-50 border-red-100">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-[10px] font-black uppercase">Nota Técnica</AlertTitle>
                <AlertDescription className="text-[11px] font-medium leading-relaxed">
                  {configError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <p className="text-center text-sm font-medium text-muted-foreground leading-relaxed px-4">
                Utiliza tu cuenta de Google para acceder de forma segura a tu panel de control.
              </p>
              
              <Button 
                className="w-full h-20 rounded-[2rem] bg-white hover:bg-slate-50 border-2 border-slate-100 text-slate-900 font-black text-lg shadow-xl hover:scale-[1.02] transition-all gap-4 group"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin h-8 w-8 text-primary" />
                ) : (
                  <>
                    <svg className="h-7 w-7 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                    </svg>
                    CONTINUAR CON GOOGLE
                  </>
                )}
              </Button>
            </div>
          </CardContent>

          <CardFooter className="justify-center mt-10 p-0 flex flex-col gap-4">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed text-center opacity-50 flex items-center gap-2">
              <ShieldCheck className="h-3 w-3" /> Conexión segura y encriptada
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase text-center mt-4">
              ¿No tienes cuenta? <Link href="/auth/register" className="text-primary font-black hover:underline ml-1">Regístrate como socio</Link>
            </p>
          </CardFooter>
        </div>
      </Card>
      
      <p className="mt-10 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed text-center">
        Al continuar, aceptas nuestros términos de servicio y privacidad.<br/>
        Solo se permiten cuentas verificadas.
      </p>
    </div>
  )
}


"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/firebase'
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, getRedirectResult, signInWithRedirect } from 'firebase/auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const [loading, setLoading] = useState(false)

  const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

  useEffect(() => {
    if (auth) {
      // Capturar resultado de redirección si el popup falló
      getRedirectResult(auth).then((result) => {
        if (result?.user) {
          if (result.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            router.push('/dashboard/admin');
          } else {
            signOut(auth);
            toast({ variant: "destructive", title: "Acceso Denegado", description: "Usa la cuenta de administrador oficial." });
          }
        }
      }).catch(console.error);

      // Detectar sesión activa del admin
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          router.push('/dashboard/admin');
        }
      });

      return () => unsubscribe();
    }
  }, [auth, router, toast]);

  const handleGoogleAdminLogin = async () => {
    if (!auth) return;
    setLoading(true);
    
    // Limpieza preventiva: cerramos cualquier sesión antes de entrar como admin
    await signOut(auth);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.warn("Popup fallido, intentando redirección...", error.code);
      try {
        await signInWithRedirect(auth, provider);
      } catch (err) {
        toast({ variant: "destructive", title: "Error de conexión", description: "Verifica los dominios autorizados en Firebase." });
        setLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold uppercase text-[10px] tracking-widest group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Volver al inicio</span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-white p-2">
        <div className="bg-slate-50/50 rounded-[3rem] p-10 md:p-12 text-center">
          <CardHeader className="p-0 mb-10 space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-[2.2rem] bg-slate-900 flex items-center justify-center text-primary shadow-2xl rotate-3">
                <ShieldAlert className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-headline font-black text-slate-900 tracking-tight">Sync Admin</CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Acceso Restringido</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-6">
            <Button 
              onClick={handleGoogleAdminLogin}
              className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.27-8.14 3.27-13.41z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                  </svg>
                  Entrar como Administrador
                </>
              )}
            </Button>

            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Solo la cuenta autorizada tiene acceso <br/> a este panel de control.
            </p>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

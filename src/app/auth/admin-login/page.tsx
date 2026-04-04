
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ShieldAlert, ArrowLeft, Loader2, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useUser } from '@/firebase'
import { GoogleAuthProvider, signOut, getRedirectResult, signInWithRedirect } from 'firebase/auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const [loading, setLoading] = useState(false)

  const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

  // 1. Manejar resultado de redirección al montar la página
  useEffect(() => {
    if (auth) {
      getRedirectResult(auth).catch((error) => {
        console.error("Auth redirect error:", error);
      });
    }
  }, [auth]);

  // 2. Redirección automática si el usuario ya está autenticado o vuelve de Google
  useEffect(() => {
    if (!isUserLoading && user) {
      if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        router.push('/dashboard/admin');
      } else {
        // Si no es el admin, forzamos cierre de sesión para limpiar el estado
        signOut(auth).then(() => {
          toast({ 
            variant: "destructive", 
            title: "Acceso Denegado", 
            description: "Esta cuenta no tiene permisos de administrador." 
          });
        });
      }
    }
  }, [user, isUserLoading, router, auth, toast]);

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      // Usamos redirección forzada para evitar errores de popup y 403
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo iniciar la conexión con Google." });
      setLoading(false);
    }
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verificando Credenciales...</p>
      </div>
    );
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
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Acceso de Máxima Autoridad</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-6">
            <Button 
              onClick={handleGoogleLogin}
              className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <><LogIn className="h-5 w-5" /> Entrar como Administrador</>
              )}
            </Button>
            
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              El sistema utilizará redirección segura para garantizar el acceso en entornos restringidos y evitar errores 403.
            </p>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

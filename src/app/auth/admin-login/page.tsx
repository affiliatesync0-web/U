
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ShieldAlert, ArrowLeft, Loader2, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useUser } from '@/firebase'
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const [loading, setLoading] = useState(false)

  const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

  // Sincronizar resultado de Google al volver
  useEffect(() => {
    if (auth) {
      getRedirectResult(auth).then((result) => {
        if (result?.user) {
          const email = result.user.email?.toLowerCase().trim();
          if (email === ADMIN_EMAIL.toLowerCase()) {
            router.replace('/dashboard/admin');
          } else {
            toast({ variant: "destructive", title: "Acceso Denegado", description: "Esta cuenta no es de administrador." });
          }
        }
      }).catch(console.error);
    }
  }, [auth, router, toast]);

  // Redirección inmediata si ya está logueado como admin
  useEffect(() => {
    if (!isUserLoading && user && user.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()) {
      router.replace('/dashboard/admin');
    }
  }, [user, isUserLoading, router]);

  const handleAdminLogin = async () => {
    if (!auth) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      // Forzamos redirección para evitar bloqueos de popups
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error de Conexión", description: "No se pudo contactar con Google." });
      setLoading(false);
    }
  }

  if (isUserLoading || (user && user.email?.toLowerCase().trim() === ADMIN_EMAIL)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative">
          <div className="h-24 w-24 rounded-3xl border-4 border-primary/20 border-t-primary animate-spin" />
          <ShieldAlert className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
        </div>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Autenticando Autoridad...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Link href="/" className="mb-10 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold uppercase text-[10px] tracking-widest group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Volver al inicio</span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-white p-2">
        <div className="bg-slate-50/50 rounded-[3rem] p-10 md:p-14 text-center">
          <CardHeader className="p-0 mb-12 space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-[2.2rem] bg-slate-900 flex items-center justify-center text-primary shadow-2xl rotate-3">
                <ShieldAlert className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-headline font-black text-slate-900 tracking-tight">Sync Admin</CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Acceso Maestro</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Button 
              onClick={handleAdminLogin}
              className="w-full h-18 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <><LogIn className="h-6 w-6" /> ENTRAR COMO ADMINISTRADOR</>
              )}
            </Button>
            
            <p className="mt-10 text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Usa exclusivamente la cuenta autorizada.<br/> El acceso se valida por correo electrónico.
            </p>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

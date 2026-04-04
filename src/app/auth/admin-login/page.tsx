
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ShieldAlert, ArrowLeft, Loader2, AlertCircle, Copy, Check, Globe } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useUser } from '@/firebase'
import { signInWithPopup, GoogleAuthProvider, signOut, getRedirectResult, signInWithRedirect } from 'firebase/auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentDomain, setCurrentDomain] = useState('')

  const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentDomain(window.location.hostname)
    }
  }, [])

  useEffect(() => {
    if (auth) {
      getRedirectResult(auth).then((result) => {
        if (result?.user) {
          if (result.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            router.push('/dashboard/admin');
          } else {
            signOut(auth);
            toast({ variant: "destructive", title: "Acceso Denegado", description: "Usa la cuenta de administrador oficial." });
          }
        }
      }).catch((error) => {
        console.error("Auth redirect error:", error);
        setLoading(false);
      });
    }
  }, [auth, router, toast]);

  useEffect(() => {
    if (!isUserLoading && user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      router.push('/dashboard/admin');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleLogin = async (mode: 'popup' | 'redirect' = 'popup') => {
    if (!auth) return;
    setLoading(true);
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      if (mode === 'popup') {
        await signInWithPopup(auth, provider);
      } else {
        await signInWithRedirect(auth, provider);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (mode === 'popup') {
        // Fallback automático a redirección si falla el popup (común en 403)
        await signInWithRedirect(auth, provider);
      } else {
        toast({ variant: "destructive", title: "Error de Conexión", description: "Verifica los dominios autorizados en Firebase." });
        setLoading(false);
      }
    }
  }

  const copyDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copiado", description: "Pega este dominio en Authorized Domains de Firebase." });
  }

  const isWrongAccount = user && user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase();

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
            {isWrongAccount && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl mb-6 text-left">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sesión Incorrecta</span>
                </div>
                <p className="text-[11px] text-amber-800 font-bold mb-3">
                  Cerrar sesión actual para poder entrar como administrador.
                </p>
                <Button 
                  onClick={() => signOut(auth)} 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-10 rounded-xl border-amber-200 text-amber-700 font-black text-[9px] uppercase hover:bg-amber-100"
                >
                  Cerrar Sesión de {user.email?.split('@')[0]}
                </Button>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={() => handleGoogleLogin('popup')}
                className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50" 
                disabled={loading || isUserLoading || isWrongAccount}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar como Administrador"}
              </Button>
              
              <Button 
                variant="ghost"
                onClick={() => handleGoogleLogin('redirect')}
                className="w-full h-12 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary"
                disabled={loading || isUserLoading || isWrongAccount}
              >
                ¿Problemas? Usar Modo Redirección
              </Button>
            </div>

            {/* Herramienta de Reparación de Dominio (Discreta) */}
            <div className="mt-8 pt-8 border-t border-slate-200/50 text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Globe className="h-3 w-3" /> Dominio que debe estar en Firebase:
              </p>
              <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-inner group">
                <code className="text-[9px] font-mono text-slate-500 truncate flex-1">{currentDomain}</code>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={copyDomain}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

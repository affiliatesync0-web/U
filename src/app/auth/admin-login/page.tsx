"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ShieldAlert, ArrowLeft, Loader2, AlertCircle, ExternalLink, ShieldCheck, Copy, Check, LogOut, Zap, Globe, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/firebase'
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithRedirect, getRedirectResult } from 'firebase/auth'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const [loading, setLoading] = useState(false)
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null)
  const [wrongEmail, setWrongEmail] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [currentHostname, setCurrentHostname] = useState("")
  const [copied, setCopied] = useState(false)

  const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHostname(window.location.hostname)
    }
    
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUserEmail(user.email);
          if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            router.push('/dashboard/admin');
          }
        } else {
          setCurrentUserEmail(null);
        }
      });

      getRedirectResult(auth).then((result) => {
        if (result?.user) {
          if (result.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            router.push('/dashboard/admin');
          } else {
            signOut(auth);
            setWrongEmail(result.user.email);
            toast({ variant: "destructive", title: "Email No Autorizado", description: "Debes usar la cuenta de administrador." });
          }
        }
      }).catch((error) => {
        console.error("Redirect Result Error:", error);
        setAuthErrorCode(error.code);
      });

      return () => unsubscribe();
    }
  }, [auth, router, toast]);

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setWrongEmail(null);
    setCurrentUserEmail(null);
    setAuthErrorCode(null);
    toast({ title: "Sesión cerrada" });
  }

  const handleCopyDomain = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(currentHostname)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: "Dominio copiado" })
    }
  }

  const handleGoogleAdminLogin = async (method: 'popup' | 'redirect' = 'popup') => {
    if (!auth) return;
    
    setLoading(true);
    setAuthErrorCode(null);
    setWrongEmail(null);
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      if (method === 'popup') {
        const result = await signInWithPopup(auth, provider);
        if (result.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          router.push('/dashboard/admin');
        } else {
          await signOut(auth);
          setWrongEmail(result.user.email);
          toast({ variant: "destructive", title: "Acceso Denegado", description: "Usa el correo administrativo autorizado." });
        }
      } else {
        await signInWithRedirect(auth, provider);
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      setAuthErrorCode(error.code);
      if (error.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);
      }
    } finally {
      if (method === 'popup') setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold uppercase text-[10px] tracking-widest group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Volver al inicio</span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-white p-2">
        <div className="bg-slate-50/50 rounded-[3rem] p-10 md:p-12">
          <CardHeader className="text-center space-y-4 p-0 mb-10">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-[2.2rem] bg-slate-900 flex items-center justify-center text-primary shadow-2xl rotate-3">
                <ShieldAlert className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-headline font-black text-slate-900 tracking-tight">Sync Admin</CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Verificación de Identidad</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-6">
            <Alert className="bg-blue-50 border-blue-100 rounded-2xl border-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-700 font-bold">
                Email Autorizado: <span className="text-blue-900 block mt-1 font-black">{ADMIN_EMAIL}</span>
              </AlertDescription>
            </Alert>

            {currentUserEmail && currentUserEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase() && (
              <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-100 space-y-4">
                <div className="flex items-center gap-3 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-tight">Sesión Incorrecta</span>
                </div>
                <p className="text-[11px] font-bold text-amber-900 leading-relaxed">
                  Estás como <b className="text-amber-600">{currentUserEmail}</b>. Cierra sesión para entrar como admin.
                </p>
                <Button 
                  onClick={handleLogout}
                  variant="default" 
                  className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión Actual
                </Button>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <div className="p-5 bg-red-50 rounded-2xl border-2 border-red-100 space-y-3">
                <div className="flex items-center gap-2 text-red-800">
                  <Globe className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Dominio para Firebase</span>
                </div>
                <p className="text-[10px] font-bold text-red-900 leading-relaxed">
                  Copia este link y agrégalo en la consola de Firebase (Authorized Domains):
                </p>
                
                <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-red-100 shadow-inner overflow-hidden">
                  <code className="flex-1 text-[10px] font-mono font-black text-slate-600 truncate">{currentHostname}</code>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-primary shrink-0" onClick={handleCopyDomain}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <a 
                    href="https://console.firebase.google.com/project/studio-9886993662-50a10/authentication/providers" 
                    target="_blank" 
                    className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-lg"
                  >
                    <ExternalLink className="h-3 w-3" /> Consola Firebase
                  </a>
                  <Button 
                    onClick={() => handleGoogleAdminLogin('redirect')}
                    variant="outline" 
                    className="flex-1 h-10 rounded-xl border-red-200 text-red-800 font-black text-[9px] uppercase tracking-widest bg-white hover:bg-red-50"
                  >
                    <Zap className="h-3 w-3 mr-1" /> Redirección
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <Button 
                onClick={() => handleGoogleAdminLogin('popup')}
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

              <p className="text-center text-slate-400 text-[9px] font-bold leading-relaxed px-4">
                Si el popup no funciona, usa el <b>Modo Redirección</b> y autoriza el dominio arriba mencionado.
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

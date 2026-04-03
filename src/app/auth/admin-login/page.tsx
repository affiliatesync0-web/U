
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ShieldAlert, ArrowLeft, Loader2, AlertCircle, ExternalLink, ShieldCheck, Globe, UserX, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/firebase'
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const auth = useAuth()
  const [loading, setLoading] = useState(false)
  const [authErrorCode, setAuthErrorCode] = useState<string | null>(null)
  const [wrongEmail, setWrongEmail] = useState<string | null>(null)
  const [currentHostname, setCurrentHostname] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHostname(window.location.hostname)
    }
  }, [])

  const handleCopyDomain = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(currentHostname)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({ title: "Dominio copiado", description: "Pégalo ahora en tu consola de Firebase." })
    }
  }

  const handleGoogleAdminLogin = async () => {
    if (!auth) return;
    
    setLoading(true);
    setAuthErrorCode(null);
    setWrongEmail(null);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const allowedEmail = 'affiliatesync0@gmail.com';
      
      if (user?.email?.toLowerCase() === allowedEmail.toLowerCase()) {
        toast({ title: "Acceso concedido", description: "Bienvenido, Administrador." });
        router.push('/dashboard/admin');
      } else {
        const attemptedEmail = user?.email;
        await signOut(auth);
        setWrongEmail(attemptedEmail || "desconocido");
        toast({ 
          variant: "destructive", 
          title: "Email Incorrecto", 
          description: `La cuenta ${attemptedEmail} no es la del administrador.` 
        });
      }
    } catch (error: any) {
      console.error("Admin Login Error:", error);
      setAuthErrorCode(error.code);
      
      let errorMessage = "Error de conexión con Google.";
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "Este puerto (9002) no está autorizado en Firebase.";
      }
      
      toast({ 
        variant: "destructive", 
        title: "Error de autenticación", 
        description: errorMessage 
      });
    } finally {
      setLoading(false);
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
              <CardTitle className="text-3xl font-headline font-black text-slate-900 tracking-tight">Panel Admin</CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Solo cuenta autorizada</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-6">
            <Alert className="bg-blue-50 border-blue-100 rounded-2xl border-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-700 font-bold">
                Email requerido: <span className="text-blue-900 block mt-1">affiliatesync0@gmail.com</span>
              </AlertDescription>
            </Alert>

            {authErrorCode === 'auth/unauthorized-domain' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <Alert variant="destructive" className="rounded-2xl border-2 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-xs font-black uppercase tracking-tighter">¡Falta autorizar el puerto 9002!</AlertTitle>
                  <AlertDescription className="text-[10px] mt-2 font-bold text-red-900 leading-relaxed">
                    Tu captura muestra los puertos 9000 y 6000, pero te falta agregar este dominio exacto:
                  </AlertDescription>
                </Alert>
                
                <div className="p-4 bg-white rounded-2xl border-2 border-red-100 shadow-inner flex flex-col gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <code className="flex-1 text-[10px] font-mono font-bold text-red-600 truncate">{currentHostname}</code>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={handleCopyDomain}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <a 
                    href="https://console.firebase.google.com/project/studio-9886993662-50a10/authentication/providers" 
                    target="_blank" 
                    className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                  >
                    <ExternalLink className="h-3 w-3" /> Abrir Consola Firebase
                  </a>
                </div>
              </div>
            )}

            {wrongEmail && (
              <Alert variant="destructive" className="rounded-2xl border-2 bg-amber-50 border-amber-100">
                <UserX className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-xs font-black uppercase text-amber-900">Cuenta Incorrecta</AlertTitle>
                <AlertDescription className="text-[10px] mt-1 font-bold text-amber-800">
                  Intentaste con: <b className="underline">{wrongEmail}</b>. Usa el Gmail administrativo.
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={handleGoogleAdminLogin}
              className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95" 
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
                  Entrar con Google
                </>
              )}
            </Button>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

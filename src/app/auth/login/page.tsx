
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, Image as ImageIcon, LogIn, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { sendEmail } from '@/lib/email'
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const auth = useAuth()
  const db = useFirestore()
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetCooldown, setResetCooldown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resetCooldown > 0) {
      timer = setInterval(() => setResetCooldown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resetCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAuthError(null)
    const cleanEmail = email.trim().toLowerCase();
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password)
      const user = cred.user;
      
      const affiliateSnap = await getDoc(doc(db, 'affiliates', user.uid));
      if (affiliateSnap.exists()) {
        router.push('/dashboard/affiliate');
      } else {
        router.push('/dashboard/buyer');
      }
    } catch (error: any) {
      let errorMsg = "No pudimos validar tus datos.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMsg = "El correo o la contraseña son incorrectos.";
      }
      setAuthError(errorMsg)
      toast({ variant: "destructive", title: "Error", description: errorMsg });
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
    
    setLoading(true);
    setAuthError(null)
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user) throw new Error("No se pudo obtener información.");

      const affiliateSnap = await getDoc(doc(db, 'affiliates', user.uid));
      const buyerSnap = await getDoc(doc(db, 'buyers', user.uid));

      if (affiliateSnap.exists()) {
        router.push('/dashboard/affiliate');
        return;
      }

      if (buyerSnap.exists()) {
        router.push('/dashboard/buyer');
        return;
      }

      setAuthError("No encontramos una cuenta vinculada. Regístrate primero.")
      
    } catch (error: any) {
      console.error("Google Login Error:", error);
      let errorMessage = "Ocurrió un error al conectar con Google.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Se cerró la ventana antes de elegir cuenta. Por favor, intenta de nuevo sin cerrarla.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "El navegador bloqueó la ventana emergente. Habilita los pop-ups.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "Dominio no autorizado en Firebase. Verifica la consola.";
      }
      
      setAuthError(errorMessage)
      toast({ variant: "destructive", title: "Error de Conexión", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast({ variant: "destructive", title: "Email Requerido", description: "Escribe tu correo arriba primero." });
      return;
    }
    setResetLoading(true)
    try {
      await sendEmail({
        to: cleanEmail,
        subject: "Instrucciones de recuperación",
        text: `Has solicitado recuperar tu contraseña en Sync Connect. Revisa tu correo.`
      });
      await sendPasswordResetEmail(auth, cleanEmail)
      toast({ title: "Enlace enviado", description: "Revisa tu bandeja de entrada." });
      setResetCooldown(60); 
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar." });
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Link href="/" className="mb-10 flex flex-col items-center gap-4 group transition-all">
        <div className="relative h-20 w-20 shadow-2xl rounded-[2rem] overflow-hidden bg-white ring-8 ring-primary/5 flex items-center justify-center">
           {displayLogoUrl ? (
             <Image src={displayLogoUrl} alt="Sync Connect" width={80} height={80} className="object-contain p-3" unoptimized />
           ) : (
             <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
           )}
        </div>
        <div className="flex flex-col items-center text-center">
           <span className="font-headline font-black text-4xl text-slate-900 tracking-tight">Sync <span className="text-primary">Connect</span></span>
        </div>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3rem] overflow-hidden bg-white p-2">
        <div className="bg-slate-50/50 rounded-[2.5rem] p-8 md:p-10">
          <CardHeader className="text-center p-0 mb-8">
            <CardTitle className="text-4xl font-headline font-black text-slate-900">{t.login}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-4">
              {authError && (
                <Alert className="bg-amber-50 border-amber-200 text-amber-800 rounded-xl mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-bold">{authError}</AlertDescription>
                </Alert>
              )}

              <Button 
                variant="outline" 
                onClick={handleGoogleLogin}
                className="w-full h-14 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 font-bold gap-3"
                disabled={loading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.27-8.14 3.27-13.41z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                </svg>
                Entrar con Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 px-2 text-slate-500">O con email</span></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <button 
                      type="button" 
                      onClick={handleForgotPassword} 
                      disabled={resetLoading || resetCooldown > 0}
                      className="text-xs text-primary hover:underline disabled:text-slate-400"
                    >
                      {resetCooldown > 0 ? `Esperar ${resetCooldown}s` : "¿Olvidaste tu contraseña?"}
                    </button>
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Iniciar Sesión"}
                </Button>
              </form>
            </div>
          </CardContent>
          <CardFooter className="justify-center mt-6 p-0">
            <p className="text-sm text-slate-500">¿No tienes cuenta? <Link href="/auth/register" className="text-primary font-bold">Regístrate ahora</Link></p>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}


"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, Image as ImageIcon, ArrowRight, ArrowLeft, ShieldAlert, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { sendEmail } from '@/lib/email'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorDetail, setErrorDetail] = useState<string | null>(null)

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleLoginSuccess = async (userEmail: string) => {
    sendEmail({
      to: userEmail,
      subject: '🔔 Nuevo Inicio de Sesión - Sync Connect',
      text: `Hola, detectamos un nuevo inicio de sesión en tu cuenta de Sync Connect.\n\nFecha: ${new Date().toLocaleString()}\nUsuario: ${userEmail}\n\nSi no fuiste tú, por favor contacta al administrador de inmediato para asegurar tu cuenta.`
    }).catch(err => console.error("Error enviando alerta de login:", err));

    toast({ title: t.welcomeBack, description: "Accediendo a tu panel..." });
    
    const ADMIN_EMAIL = 'affiliatesync0@gmail.com';
    if (userEmail.toLowerCase().trim() === ADMIN_EMAIL) {
      router.push('/dashboard/admin');
    } else {
      const affSnap = await getDoc(doc(db, 'affiliates', auth.currentUser?.uid || ''));
      if (affSnap.exists()) {
        router.push('/dashboard/affiliate');
      } else {
        router.push('/dashboard/buyer');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorDetail(null)
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) return;
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPass)
      await handleLoginSuccess(cleanEmail);
    } catch (error: any) {
      console.error("Login error code:", error.code);
      let msg = "Credenciales incorrectas o cuenta no registrada.";
      if (error.code === 'auth/invalid-credential') msg = "Email o contraseña inválidos.";
      if (error.code === 'auth/too-many-requests') msg = "Demasiados intentos fallidos.";
      
      setErrorDetail(msg);
      toast({ variant: "destructive", title: "Error de Acceso", description: msg });
      setLoading(false)
    }
  }

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // CRÍTICO: Detener propagación para evitar cierre de ventana
    
    if (googleLoading) return;
    
    setGoogleLoading(true);
    setErrorDetail(null);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user.email) {
        await handleLoginSuccess(result.user.email);
      }
    } catch (error: any) {
      console.error("Google login error:", error.code, error.message);
      let detail = "No se pudo completar el inicio de sesión con Google.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        detail = "La ventana se cerró antes de completar. Esto ocurre si no has agregado tu dominio en Firebase Console -> Authentication -> Settings -> Authorized Domains.";
      } else if (error.code === 'auth/popup-blocked') {
        detail = "Tu navegador bloqueó la ventana emergente. Por favor, habilita los popups.";
      } else if (error.code === 'auth/unauthorized-domain') {
        detail = "DOMINIO NO AUTORIZADO: Debes agregar este dominio en la Consola de Firebase.";
      }
      
      setErrorDetail(detail);
      toast({ variant: "destructive", title: "Error con Google", description: detail });
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 transition-colors duration-300">
      <div className="fixed top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="fixed top-6 left-6">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black text-[10px] uppercase tracking-widest group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Volver</span>
        </Link>
      </div>

      <Link href="/" className="mb-10 flex flex-col items-center gap-4 group transition-all">
        <div className="relative h-20 w-20 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card ring-8 ring-primary/5 flex items-center justify-center group-hover:scale-105 transition-transform border border-border/50">
           {displayLogoUrl ? (
             <Image src={displayLogoUrl} alt="Sync Connect" width={80} height={80} className="object-contain p-3" unoptimized />
           ) : (
             <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
           )}
        </div>
        <span className="font-headline font-black text-4xl text-foreground tracking-tight">Sync <span className="text-primary">Connect</span></span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-card p-2 ring-1 ring-border/50">
        <div className="bg-muted/30 rounded-[3rem] p-8 md:p-12">
          <CardHeader className="text-center p-0 mb-10">
            <CardTitle className="text-4xl font-headline font-black text-foreground tracking-tight">{t.login}</CardTitle>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">Ingresa tus credenciales para continuar</p>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            {errorDetail && (
              <Alert variant="destructive" className="mb-2 rounded-2xl bg-red-50 border-red-100 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Aviso del Sistema</AlertTitle>
                <AlertDescription className="text-xs font-bold leading-relaxed">{errorDetail}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="button"
              onClick={handleGoogleLogin} 
              variant="outline" 
              className="w-full h-14 rounded-2xl font-bold border-border bg-card hover:bg-muted transition-all gap-3 shadow-sm"
              disabled={loading || googleLoading}
            >
              {googleLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.34v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.12z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-1.57z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continuar con Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-background px-4 text-muted-foreground">o usa tu email</span></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Tu Email</Label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="h-14 rounded-2xl bg-card border-none ring-1 ring-border focus:ring-4 focus:ring-primary/10 transition-all font-bold px-6" 
                  placeholder="ejemplo@correo.com" 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Tu Contraseña</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="h-14 rounded-2xl bg-card border-none ring-1 ring-border focus:ring-4 focus:ring-primary/10 transition-all font-bold px-6" 
                    placeholder="••••••••" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]" disabled={loading || googleLoading}>
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                  <span className="flex items-center gap-2 uppercase">Entrar a mi Panel <ArrowRight className="h-5 w-5" /></span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center mt-10 p-0 flex flex-col gap-2">
            <p className="text-xs font-bold text-muted-foreground">¿No tienes cuenta? <Link href="/auth/register" className="text-primary font-black hover:underline ml-1">Regístrate gratis</Link></p>
            <Link href="/auth/admin-login" className="text-[9px] font-black uppercase text-muted-foreground/50 hover:text-foreground transition-colors tracking-widest">Acceso Maestro</Link>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}

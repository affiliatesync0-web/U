
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { ArrowLeft, Eye, EyeOff, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { sendEmail } from '@/lib/email'

export default function AffiliateLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const auth = useAuth()
  const db = useFirestore()
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Fetch Live Logo
  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const cleanEmail = email.trim().toLowerCase();
    
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password)
      const user = cred.user;

      // NOTIFICACIÓN DE SEGURIDAD POR CORREO (SE EJECUTA EN SEGUNDO PLANO)
      if (user.email) {
        sendEmail({
          to: user.email,
          subject: t.language === 'es' ? "Notificación de Seguridad: Nuevo Inicio de Sesión" : "Security Alert: New Login Detected",
          text: t.language === 'es' 
            ? `Hola, te informamos que se ha detectado un nuevo inicio de sesión en tu cuenta de Sync Connect hoy ${new Date().toLocaleString()}. Si has sido tú, no es necesario que realices ninguna acción. Si no reconoces esta actividad, te recomendamos cambiar tu contraseña inmediatamente.`
            : `Hello, we are informing you that a new login was detected on your Sync Connect account today ${new Date().toLocaleString()}. If this was you, no action is needed. If you do not recognize this activity, we recommend changing your password immediately.`
        });
      }

      const affiliateSnap = await getDoc(doc(db, 'affiliates', user.uid));
      
      toast({
        title: t.language === 'es' ? "Acceso Correcto" : "Login Successful",
        description: t.language === 'es' ? "Bienvenido a Sync Connect." : "Welcome to Sync Connect.",
      })

      if (affiliateSnap.exists()) {
        router.push('/dashboard/affiliate');
      } else {
        router.push('/dashboard/buyer');
      }
      
    } catch (error: any) {
      console.error("Login Error:", error.code);
      let errorMsg = t.language === 'es' ? "No pudimos validar tus datos." : "We couldn't validate your data.";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMsg = t.language === 'es' ? "El correo o la contraseña son incorrectos." : "Email or password incorrect.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = t.language === 'es' ? "Cuenta bloqueada temporalmente por seguridad. Intenta más tarde." : "Account temporarily locked for security. Try again later.";
      }

      toast({
        variant: "destructive",
        title: "Error de Acceso",
        description: errorMsg,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast({
        variant: "destructive",
        title: "Email Requerido",
        description: t.language === 'es' ? "Escribe tu correo arriba para enviarte el enlace de recuperación." : "Enter your email above to receive the recovery link.",
      })
      return
    }

    setResetLoading(true)

    try {
      await sendPasswordResetEmail(auth, cleanEmail)
      toast({
        title: "Correo Enviado",
        description: t.language === 'es' 
          ? `Revisa tu bandeja de entrada o SPAM en ${cleanEmail}.` 
          : `Check your inbox or SPAM folder at ${cleanEmail}.`,
      })
    } catch (error: any) {
      let errorMsg = t.language === 'es' ? "Error en el envío." : "Send failed.";
      if (error.code === 'auth/user-not-found') errorMsg = "No existe cuenta con este correo.";
      
      toast({
        variant: "destructive",
        title: "Error de Recuperación",
        description: `${errorMsg} (${error.code})`,
      })
    } finally {
      setTimeout(() => setResetLoading(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Link href="/" className="mb-10 flex flex-col items-center gap-4 group transition-all">
        <div className="relative h-20 w-20 shadow-2xl rounded-[2rem] overflow-hidden bg-white ring-8 ring-primary/5 group-hover:scale-110 transition-transform flex items-center justify-center">
           {displayLogoUrl ? (
             <Image 
                src={displayLogoUrl} 
                alt="Sync Connect" 
                fill 
                className="object-contain p-3"
                unoptimized
             />
           ) : (
             <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
           )}
        </div>
        <div className="flex flex-col items-center">
           <span className="font-headline font-black text-4xl text-slate-900 tracking-tight">Sync <span className="text-primary">Connect</span></span>
           <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mt-1 ml-1 flex items-center gap-1">
             <Sparkles className="h-2 w-2" /> Premium Network
           </span>
        </div>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3rem] overflow-hidden bg-white p-2">
        <div className="bg-slate-50/50 rounded-[2.5rem] p-8 md:p-10">
          <CardHeader className="text-center p-0 mb-10">
            <CardTitle className="text-4xl font-headline font-black text-slate-900">{t.login}</CardTitle>
            <CardDescription className="font-bold text-slate-400 mt-2 uppercase text-[10px] tracking-widest">
              Gestiona tu ecosistema de ventas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-black text-xs text-slate-600 uppercase tracking-widest px-1">{t.email}</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@gmail.com" 
                  required 
                  className="h-16 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary transition-all text-lg"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor="password" className="font-black text-xs text-slate-600 uppercase tracking-widest">{t.password}</Label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline flex items-center gap-1"
                    disabled={resetLoading}
                  >
                    {resetLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : t.forgotPassword}
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••" 
                    required 
                    className="h-16 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary transition-all pr-12 text-lg"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 font-black text-xl py-8 rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all mt-6" 
                disabled={loading}
              >
                {loading ? (t.language === 'es' ? "Autenticando..." : "Validating...") : t.login}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center p-0 mt-10">
            <p className="text-sm font-bold text-slate-400">
              {t.language === 'es' ? "¿No tienes cuenta?" : "No account yet?"} <Link href="/auth/register" className="text-primary hover:underline font-black ml-1 uppercase tracking-widest text-[11px]">{t.getStarted}</Link>
            </p>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}

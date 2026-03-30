
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { ArrowLeft, Eye, EyeOff, Loader2, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'

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
      const userId = cred.user.uid;

      const affiliateSnap = await getDoc(doc(db, 'affiliates', userId));
      
      toast({
        title: t.language === 'es' ? "¡Hola de nuevo!" : "Welcome back!",
        description: t.language === 'es' ? "Has iniciado sesión correctamente." : "Logged in successfully.",
      })

      if (affiliateSnap.exists()) {
        router.push('/dashboard/affiliate');
      } else {
        router.push('/dashboard/buyer');
      }
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de Acceso",
        description: t.language === 'es' ? "Tus credenciales no coinciden con nuestros registros." : "Your credentials don't match our records.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email || !email.includes('@')) {
      toast({
        variant: "destructive",
        title: "Email Requerido",
        description: t.language === 'es' ? "Por favor, escribe un correo válido arriba para enviarte el enlace." : "Please enter a valid email to receive the link.",
      })
      return
    }

    setResetLoading(true)
    const cleanEmail = email.trim().toLowerCase();

    try {
      await sendPasswordResetEmail(auth, cleanEmail)
      toast({
        title: "Enlace enviado",
        description: t.language === 'es' 
          ? `Revisa tu correo ${cleanEmail}. USA EL ENLACE MÁS RECIENTE. Si no lo ves, revisa SPAM.` 
          : `Check your email ${cleanEmail}. USE THE MOST RECENT LINK. Check SPAM if not found.`,
      })
    } catch (error: any) {
      let errorMsg = "";
      if (error.code === 'auth/user-not-found') {
        errorMsg = "No existe cuenta con este correo.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = "Demasiados intentos. Espera unos minutos.";
      } else if (error.code === 'auth/internal-error') {
        errorMsg = "Error en el servidor SMTP de Firebase. Revisa puerto 465 y contraseña en la consola.";
      } else {
        errorMsg = `Error (${error.code}). Contacta al administrador.`;
      }

      toast({
        variant: "destructive",
        title: "Fallo en Recuperación",
        description: errorMsg,
      })
    } finally {
      // Pequeño delay para evitar spam del botón
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
              Entra a tu universo de marketing
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
                  placeholder="tu@correo.com" 
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
                {loading ? (t.language === 'es' ? "Entrando..." : "Entering...") : t.login}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center p-0 mt-10">
            <p className="text-sm font-bold text-slate-400">
              {t.language === 'es' ? "¿Eres nuevo?" : "New here?"} <Link href="/auth/register" className="text-primary hover:underline font-black ml-1 uppercase tracking-widest text-[11px]">{t.getStarted}</Link>
            </p>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}

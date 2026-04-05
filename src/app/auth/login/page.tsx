
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, Image as ImageIcon, ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { sendEmail } from '@/lib/email'

export default function LoginPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return;
    setLoading(true)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      const user = userCredential.user;

      sendEmail({
        to: email.trim().toLowerCase(),
        subject: '🔔 Nuevo Inicio de Sesión - Sync Connect',
        text: `Hola, detectamos un nuevo inicio de sesión en tu cuenta de Sync Connect.\n\nFecha: ${new Date().toLocaleString()}\nUsuario: ${email}\n\nSi no fuiste tú, por favor contacta al administrador de inmediato para asegurar tu cuenta.`
      }).catch(err => console.error("Error enviando alerta de login:", err));

      toast({ title: t.welcomeBack, description: "Accediendo a tu panel..." });
      
      if (email.toLowerCase().trim() === 'affiliatesync0@gmail.com') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/affiliate');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error de Acceso", description: "Credenciales incorrectas o cuenta no registrada." });
      setLoading(false)
    }
  }

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
              <Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                  <span className="flex items-center gap-2 uppercase">Entrar a mi Panel <ArrowRight className="h-5 w-5" /></span>
                )}
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3">
               <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
               <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase">
                 Si olvidaste tu clave, contacta al administrador de Sync Connect para recibir una nueva contraseña de acceso.
               </p>
            </div>
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

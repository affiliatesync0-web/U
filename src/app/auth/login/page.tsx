
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, Image as ImageIcon, Mail, Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
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

  const handleLoginSuccess = async (userEmail: string, uid: string) => {
    sendEmail({
      to: 'affiliatesync0@gmail.com',
      subject: '🔔 Nuevo Inicio de Sesión Detectado',
      text: `Acceso en Sync Connect.\n\nUsuario: ${userEmail}\nUID: ${uid}`
    }).catch(() => {});

    toast({ title: t.welcomeBack, description: "Accediendo a tu panel..." });
    
    const ADMIN_EMAIL = 'affiliatesync0@gmail.com';
    if (userEmail.toLowerCase().trim() === ADMIN_EMAIL) {
      router.push('/dashboard/admin');
    } else {
      const affSnap = await getDoc(doc(db, 'affiliates', uid));
      if (affSnap.exists()) {
        router.push('/dashboard/affiliate');
      } else {
        const buyerSnap = await getDoc(doc(db, 'buyers', uid));
        if (buyerSnap.exists()) {
          router.push('/dashboard/buyer');
        } else {
          toast({ variant: "destructive", title: "Perfil no encontrado", description: "Tu cuenta no tiene un perfil asignado. Contacta a soporte." });
          router.push('/');
        }
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) return;
    setLoading(true)
    try {
      const result = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass)
      await handleLoginSuccess(cleanEmail, result.user.uid);
    } catch (error: any) {
      console.error("Login Error:", error.code);
      let msg = "Credenciales incorrectas.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        msg = "Email o contraseña no coinciden con nuestros registros.";
      } else if (error.code === 'auth/too-many-requests') {
        msg = "Demasiados intentos. Tu cuenta ha sido bloqueada temporalmente por seguridad.";
      }
      toast({ variant: "destructive", title: "Error de Acceso", description: msg });
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 transition-colors duration-300">
      <div className="fixed top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="mb-8 text-center space-y-6">
        <Link href="https://syncacademy.systeme.io/sync-connect" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Volver a Sync Academy</span>
        </Link>

        <Link href="https://syncacademy.systeme.io/sync-connect" className="flex flex-col items-center gap-4 group transition-all">
          <div className="relative h-20 w-20 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card ring-8 ring-primary/5 flex items-center justify-center border border-border/50">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Sync Connect" width={80} height={80} className="object-contain p-3" unoptimized />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
            )}
          </div>
          <span className="font-headline font-black text-4xl text-foreground tracking-tight uppercase italic">Sync <span className="text-primary">Connect</span></span>
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-card p-2 ring-1 ring-border/50">
        <div className="bg-muted/30 rounded-[3rem] p-8 md:p-12">
          
          <CardHeader className="text-center p-0 mb-10">
            <CardTitle className="text-3xl font-headline font-black text-foreground tracking-tight leading-none uppercase italic">Iniciar <span className="text-primary">Sesión</span></CardTitle>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-2">Acceso exclusivo para socios y clientes</p>
          </CardHeader>

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Tu Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="h-14 rounded-2xl bg-card border-none ring-1 ring-border focus:ring-4 focus:ring-primary/10 transition-all font-bold pl-12 pr-6" 
                  placeholder="ejemplo@correo.com" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                <Link href="/auth/forgot-password" size="sm" className="text-[9px] font-black uppercase text-primary hover:underline">¿La olvidaste?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="h-14 rounded-2xl bg-card border-none ring-1 ring-border focus:ring-4 focus:ring-primary/10 transition-all font-bold pl-12 pr-6" 
                  placeholder="••••••••" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "ACCEDER AHORA"}
            </Button>
          </form>

          <CardFooter className="justify-center mt-6 p-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed text-center opacity-50">
              Sistema de Seguridad Sync Activo
            </p>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}

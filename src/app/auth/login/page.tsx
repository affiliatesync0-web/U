
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, Image as ImageIcon, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'

export default function LoginPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const auth = useAuth()
  const db = useFirestore()
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
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      // El Shell detectará el cambio de auth y redirigirá
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error de Acceso", description: "Credenciales incorrectas o cuenta no registrada." });
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Link href="/" className="mb-10 flex flex-col items-center gap-4 group transition-all">
        <div className="relative h-20 w-20 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white ring-8 ring-primary/5 flex items-center justify-center group-hover:scale-105 transition-transform">
           {displayLogoUrl ? (
             <Image src={displayLogoUrl} alt="Sync Connect" width={80} height={80} className="object-contain p-3" unoptimized />
           ) : (
             <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
           )}
        </div>
        <span className="font-headline font-black text-4xl text-slate-900 tracking-tight">Sync <span className="text-primary">Connect</span></span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-white p-2">
        <div className="bg-slate-50/50 rounded-[3rem] p-8 md:p-12">
          <CardHeader className="text-center p-0 mb-10">
            <CardTitle className="text-4xl font-headline font-black text-slate-900 tracking-tight">{t.login}</CardTitle>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2">Ingresa tus credenciales para continuar</p>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Tu Email</Label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="h-14 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all font-bold" 
                  placeholder="ejemplo@correo.com" 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Tu Contraseña</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    className="h-14 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all font-bold" 
                    placeholder="••••••••" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                  <span className="flex items-center gap-2">ENTRAR A MI PANEL <ArrowRight className="h-5 w-5" /></span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center mt-10 p-0 flex flex-col gap-2">
            <p className="text-xs font-bold text-slate-400">¿No tienes cuenta? <Link href="/auth/register" className="text-primary font-black hover:underline ml-1">Regístrate gratis</Link></p>
            <Link href="/auth/admin-login" className="text-[9px] font-black uppercase text-slate-300 hover:text-slate-500 tracking-widest">Acceso Maestro</Link>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}

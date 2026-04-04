
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, Image as ImageIcon, LogIn } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase'
import { signInWithEmailAndPassword, GoogleAuthProvider, getRedirectResult, signInWithRedirect } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const auth = useAuth()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handlePostLoginRedirect = async (currentUser: any) => {
    if (!currentUser) return;
    
    if (currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      router.push('/dashboard/admin');
      return;
    }
    const affiliateSnap = await getDoc(doc(db, 'affiliates', currentUser.uid));
    router.push(affiliateSnap.exists() ? '/dashboard/affiliate' : '/dashboard/buyer');
  }

  useEffect(() => {
    if (auth) {
      getRedirectResult(auth).catch(console.error);
    }
  }, [auth]);

  useEffect(() => {
    if (!isUserLoading && user) {
      handlePostLoginRedirect(user);
    }
  }, [user, isUserLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      await handlePostLoginRedirect(cred.user);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Datos de acceso incorrectos." });
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo conectar con Google." });
      setLoading(false);
    }
  };

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
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
        <span className="font-headline font-black text-4xl text-slate-900 tracking-tight">Sync <span className="text-primary">Connect</span></span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3rem] overflow-hidden bg-white p-2">
        <div className="bg-slate-50/50 rounded-[2.5rem] p-8 md:p-10">
          <CardHeader className="text-center p-0 mb-8">
            <CardTitle className="text-4xl font-headline font-black text-slate-900">{t.login}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            <Button 
              variant="outline" 
              onClick={handleGoogleLogin}
              className="w-full h-14 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 font-bold gap-3 shadow-sm"
              disabled={loading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.27-8.14 3.27-13.41z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/></svg>
              Entrar con Google
            </Button>

            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-[10px] uppercase font-black text-slate-400"><span className="bg-slate-50/50 px-2">O con email</span></div></div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold text-[10px] uppercase tracking-widest text-slate-500 ml-1">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-[10px] uppercase tracking-widest text-slate-500 ml-1">Contraseña</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Iniciar Sesión"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center mt-8 p-0">
            <p className="text-xs font-bold text-slate-400">¿No tienes cuenta? <Link href="/auth/register" className="text-primary font-black hover:underline ml-1">Regístrate</Link></p>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Eye, EyeOff, Loader2, Image as ImageIcon, ArrowLeft, ExternalLink, Globe, Zap, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const auth = useAuth()
  const db = useFirestore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [currentHostname, setCurrentHostname] = useState("")
  const [copied, setCopied] = useState(false)

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentHostname(window.location.hostname)
    }
    
    if (auth && db) {
      // Capturar resultado de redirección al volver de Google
      getRedirectResult(auth).then(async (result) => {
        if (result?.user) {
          const user = result.user;
          const affiliateSnap = await getDoc(doc(db, 'affiliates', user.uid));
          if (affiliateSnap.exists()) {
            router.push('/dashboard/affiliate');
          } else {
            router.push('/dashboard/buyer');
          }
        }
      }).catch((error) => {
        console.error("Login Result Error:", error);
      });
    }
  }, [auth, db, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const cleanEmail = email.trim().toLowerCase();
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password)
      const user = cred.user;
      const affiliateSnap = await getDoc(doc(db, 'affiliates', user.uid));
      router.push(affiliateSnap.exists() ? '/dashboard/affiliate' : '/dashboard/buyer');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Datos incorrectos." });
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async (method: 'popup' | 'redirect' = 'popup') => {
    if (!auth || !db) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      if (method === 'popup') {
        const result = await signInWithPopup(auth, provider);
        const affiliateSnap = await getDoc(doc(db, 'affiliates', result.user.uid));
        router.push(affiliateSnap.exists() ? '/dashboard/affiliate' : '/dashboard/buyer');
      } else {
        await signInWithRedirect(auth, provider);
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/network-request-failed') {
        await signInWithRedirect(auth, provider);
      }
    } finally {
      if (method === 'popup') setLoading(false);
    }
  };

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Dominio copiado" });
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
          <CardContent className="p-0 space-y-6">
            
            <div className="p-5 bg-red-50 rounded-2xl border-2 border-red-100 space-y-3">
              <div className="flex items-center gap-2 text-red-800">
                <Globe className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Autorización de Dominio</span>
              </div>
              <p className="text-[9px] font-bold text-red-900 leading-relaxed">
                Importante: Verifica que este dominio exacto esté en tu consola de Firebase:
              </p>
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-red-100 shadow-inner">
                <code className="flex-1 text-[9px] font-mono font-black text-slate-600 truncate">{currentHostname}</code>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-primary shrink-0" onClick={handleCopyDomain}>
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <a href="https://console.firebase.google.com/" target="_blank" className="flex-1 h-9 bg-red-600 text-white rounded-xl flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-widest shadow-lg">
                  Consola <ExternalLink className="h-3 w-3" />
                </a>
                <Button onClick={() => handleGoogleLogin('redirect')} variant="outline" className="flex-1 h-9 rounded-xl border-red-200 text-red-800 font-black text-[8px] uppercase tracking-widest bg-white">
                  <Zap className="h-3 w-3 mr-1" /> Redirección
                </Button>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => handleGoogleLogin('popup')}
              className="w-full h-14 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 font-bold gap-3 shadow-sm"
              disabled={loading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.27-8.14 3.27-13.41z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/></svg>
              Entrar con Google
            </Button>

            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 px-2 text-slate-500">O con email</span></div></div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
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
          </CardContent>
          <CardFooter className="justify-center mt-6 p-0">
            <p className="text-sm text-slate-500">¿No tienes cuenta? <Link href="/auth/register" className="text-primary font-bold">Regístrate ahora</Link></p>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}


"use client"

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Loader2, 
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Triangle,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useMemoFirebase, useDoc, useUser } from '@/firebase'
import { 
  setPersistence, 
  browserLocalPersistence, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'

const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

function LoginPageContent() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const logoConfigRef = useMemoFirebase(() => db ? doc(db, 'site_config', 'site-logo') : null, [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  // Redirección automática si ya está logueado y es válido
  useEffect(() => {
    if (user && !isUserLoading) {
      const checkAccess = async () => {
        const cleanEmail = user.email?.toLowerCase().trim();
        if (cleanEmail === ADMIN_EMAIL) {
          router.replace('/dashboard/admin');
          return;
        }
        const affSnap = await getDoc(doc(db, 'affiliates', user.uid));
        if (affSnap.exists()) {
          router.replace('/dashboard/affiliate');
        } else {
          // Si es un comprador u otro, lo sacamos
          await signOut(auth);
          setErrorMsg("Acceso Restringido: Este portal es exclusivo para socios autorizados.");
        }
      };
      checkAccess();
    }
  }, [user, isUserLoading, db, router, auth]);

  const handleLoginSuccess = async (userEmail: string | null, uid: string) => {
    const cleanEmail = userEmail?.toLowerCase().trim() || '';
    
    if (cleanEmail === ADMIN_EMAIL) {
      router.replace('/dashboard/admin');
      return;
    }

    try {
      const affSnap = await getDoc(doc(db, 'affiliates', uid));
      if (affSnap.exists()) {
        router.replace('/dashboard/affiliate');
        return;
      }

      // Si no es admin ni afiliado, es un comprador o cuenta no autorizada
      await signOut(auth);
      setErrorMsg("Su cuenta no tiene permisos de socio. Acceso denegado.");
      setLoading(false);

    } catch (err) {
      console.error("Login Success Error:", err);
      setLoading(false);
      setErrorMsg("Error al validar credenciales.");
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setErrorMsg(null);
    setLoading(true);
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        await handleLoginSuccess(result.user.email, result.user.uid);
      }
    } catch (error: any) {
      setLoading(false);
      setErrorMsg("No se pudo conectar con Google.");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !auth) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await handleLoginSuccess(result.user.email, result.user.uid);
    } catch (error: any) {
      setLoading(false);
      setErrorMsg("Email o contraseña incorrectos.");
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Verificando Identidad...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,153,0,0.03),transparent_70%)] pointer-events-none" />

      <div className="mb-12 relative z-10">
        <div className="relative h-14 w-40 md:h-16 md:w-52">
          {displayLogoUrl ? (
            <Image src={displayLogoUrl} alt="Sync Connect" fill className="object-contain" unoptimized />
          ) : (
            <span className="text-white font-black text-3xl uppercase italic tracking-tighter">Sync <span className="text-primary">Connect</span></span>
          )}
        </div>
      </div>

      <Card className="w-full max-w-[420px] border-none shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] rounded-[3rem] bg-white overflow-hidden p-2 relative z-10">
        <div className="bg-slate-50/50 rounded-[2.5rem] p-10 md:p-14">
          <div className="flex flex-col items-center text-center space-y-4 mb-10">
            <div className="h-20 w-20 bg-slate-950 rounded-[1.75rem] flex items-center justify-center text-primary shadow-2xl mb-2 rotate-3 border border-white/5">
               <Lock className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-black text-slate-950 uppercase italic leading-none tracking-tight">Acceso Socios</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Infraestructura de Gestión Elite</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
              <Triangle className="h-4 w-4 text-red-600 fill-red-600 mt-1 shrink-0" />
              <div className="space-y-1">
                <h4 className="text-[10px] font-black uppercase text-red-600">Error de Seguridad</h4>
                <p className="text-[11px] text-red-700 font-bold leading-tight">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">ID de Usuario (Email)</Label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="h-14 rounded-2xl border-none ring-1 ring-slate-200 bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold px-6 text-sm" 
                placeholder="socio@sync.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contraseña</Label>
                <Link href="/auth/forgot-password" px-1 className="text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-colors">¿Ayuda?</Link>
              </div>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="h-14 rounded-2xl border-none ring-1 ring-slate-200 bg-white focus:ring-4 focus:ring-primary/10 transition-all font-bold px-6 text-sm" 
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit"
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-widest h-18 rounded-[1.5rem] shadow-2xl transition-all active:scale-95 group" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <>ENTRAR AL SISTEMA <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <Button 
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full border-none ring-1 ring-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-black text-[10px] uppercase tracking-widest h-14 rounded-2xl transition-all flex items-center justify-center gap-3"
              disabled={loading}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
              </svg>
              Google Auth
            </Button>
          </div>
        </div>
      </Card>

      <footer className="mt-16 flex items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] relative z-10">
         <ShieldCheck className="h-4 w-4 text-primary" /> Protección Sync Connect Active
      </footer>
    </div>
  )
}

export default function RootLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <LoginPageContent />
    </Suspense>
  )
}

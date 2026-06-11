"use client"

import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Loader2, 
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
          await signOut(auth);
          setErrorMsg("Acceso Denegado: Su cuenta no cuenta con permisos de socio activo.");
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

      await signOut(auth);
      setErrorMsg("Acceso Restringido: Credenciales no autorizadas para este portal.");
      setLoading(false);

    } catch (err) {
      setLoading(false);
      setErrorMsg("Error crítico en la validación de identidad.");
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
      setErrorMsg("No se pudo establecer conexión con el proveedor de autenticación.");
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
      setErrorMsg("Las credenciales proporcionadas no coinciden con nuestros registros.");
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Iniciando Protocolos de Seguridad</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="mb-14">
        <div className="relative h-16 w-48 md:w-56">
          {displayLogoUrl ? (
            <Image src={displayLogoUrl} alt="Sync Connect" fill className="object-contain" unoptimized />
          ) : (
            <span className="text-white font-black text-3xl uppercase italic tracking-tighter">Sync <span className="text-primary">Connect</span></span>
          )}
        </div>
      </div>

      <Card className="w-full max-w-[400px] border border-white/5 shadow-2xl rounded-none bg-white p-1">
        <div className="bg-white p-8 md:p-12">
          <div className="flex flex-col items-center text-center space-y-4 mb-10">
            <div className="h-16 w-16 bg-slate-950 flex items-center justify-center text-primary shadow-sm mb-2 border border-white/10">
               <Lock className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-headline font-black text-slate-950 uppercase tracking-tight">Acceso Privado</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Infraestructura Tecnológica de Gestión</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-8 p-4 bg-slate-50 border-l-4 border-red-600 flex gap-3 items-start">
              <Triangle className="h-4 w-4 text-red-600 fill-red-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <h4 className="text-[10px] font-black uppercase text-red-600">Error de Seguridad</h4>
                <p className="text-[11px] text-slate-600 font-bold leading-tight">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">ID de Usuario</Label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="h-12 rounded-none border-slate-200 bg-slate-50 focus:ring-0 focus:border-slate-900 transition-colors font-bold px-4 text-sm" 
                placeholder="usuario@syncconnect.ni"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contraseña</Label>
                <Link href="/auth/forgot-password" px-1 className="text-[9px] font-bold uppercase text-slate-400 hover:text-primary transition-colors">Solicitar Asistencia</Link>
              </div>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="h-12 rounded-none border-slate-200 bg-slate-50 focus:ring-0 focus:border-slate-900 transition-colors font-bold px-4 text-sm" 
                placeholder="••••••••"
              />
            </div>

            <Button 
              type="submit"
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] h-14 rounded-none shadow-lg transition-all active:bg-slate-800" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENTRAR AL SISTEMA"}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-4">
            <Button 
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-black text-[10px] uppercase tracking-widest h-12 rounded-none transition-all flex items-center justify-center gap-3"
              disabled={loading}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
              </svg>
              Google Auth Service
            </Button>
          </div>
        </div>
      </Card>

      <footer className="mt-16 flex items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
         <ShieldCheck className="h-4 w-4 text-slate-500" /> Protección Sync Active • Managed Environment
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

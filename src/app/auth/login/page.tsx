
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
  ShieldAlert,
  Info,
  ChevronRight,
  Triangle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useMemoFirebase, useDoc, useUser } from '@/firebase'
import { 
  setPersistence, 
  browserLocalPersistence, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

function LoginContent() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isUserLoading: isGlobalLoading } = useUser()
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [authErrorType, setAuthErrorType] = useState<'domain' | 'method' | 'generic' | 'cancelled' | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const redirectPath = searchParams.get('redirect')

  const logoConfigRef = useMemoFirebase(() => db ? doc(db, 'site_config', 'site-logo') : null, [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  // DETECCIÓN MAESTRA EN CARGA INICIAL
  useEffect(() => {
    if (user && !isGlobalLoading) {
      const cleanEmail = user.email?.toLowerCase().trim();
      if (cleanEmail === ADMIN_EMAIL) {
        window.location.href = '/dashboard/admin';
      }
    }
  }, [user, isGlobalLoading]);

  const handleLoginSuccess = async (userEmail: string | null, uid: string, displayName?: string | null) => {
    const cleanEmail = userEmail?.toLowerCase().trim() || '';
    
    // 1. VERIFICACIÓN MAESTRA (ADMIN)
    if (cleanEmail === ADMIN_EMAIL) {
      window.location.href = '/dashboard/admin';
      return;
    }

    try {
      // 2. VERIFICACIÓN DE AFILIADO
      const affSnap = await getDoc(doc(db, 'affiliates', uid));
      if (affSnap.exists()) {
        router.replace(redirectPath || '/dashboard/affiliate');
        return;
      }

      // 3. VERIFICACIÓN DE COMPRADOR EXISTENTE
      const buyerSnap = await getDoc(doc(db, 'buyers', uid));
      if (buyerSnap.exists()) {
        router.replace(redirectPath || '/dashboard/buyer');
        return;
      }

      // 4. CREAR PERFIL DE COMPRADOR SI ES NUEVO (Y NO ES ADMIN)
      const names = (displayName || 'Usuario Sync').split(' ');
      await setDoc(doc(db, 'buyers', uid), {
        id: uid,
        firstName: names[0] || 'Usuario',
        lastName: names.slice(1).join(' ') || 'Connect',
        email: cleanEmail,
        registeredAt: new Date().toISOString(),
        status: 'Active'
      }, { merge: true });

      router.replace(redirectPath || '/dashboard/buyer');

    } catch (err) {
      console.error("Login Success Error:", err);
      router.replace(redirectPath || '/dashboard/buyer');
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setAuthErrorType(null);
    setErrorMsg(null);
    setLoading(true);
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        await handleLoginSuccess(result.user.email, result.user.uid, result.user.displayName);
      }
    } catch (error: any) {
      console.error("Google Login Error:", error.code);
      setLoading(false);
      if (error.code === 'auth/unauthorized-domain') setAuthErrorType('domain');
      else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') setAuthErrorType('cancelled');
      else setErrorMsg("No se pudo conectar con Google.");
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
      handleLoginSuccess(result.user.email, result.user.uid, result.user.displayName);
    } catch (error: any) {
      setLoading(false);
      setErrorMsg("Email o contraseña incorrectos.");
    }
  };

  return (
    <div className="min-h-screen bg-white md:bg-[#EAEDED] flex flex-col items-center pt-8 pb-12">
      <div className="mb-4">
        <Link href="/">
          <div className="relative h-12 w-32 md:h-14 md:w-36">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Sync Connect" fill className="object-contain" unoptimized />
            ) : (
              <span className="text-[#111] font-black text-2xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
            )}
          </div>
        </Link>
      </div>

      <Card className="w-full max-w-[350px] border border-[#ddd] shadow-none md:shadow-sm rounded-[4px] bg-white p-6 md:p-8">
        <h1 className="text-[28px] font-normal text-[#111] mb-5 leading-tight">Iniciar sesión</h1>

        {redirectPath && (
          <Alert className="mb-4 bg-amber-50 border-amber-200 rounded-[4px] py-2 px-3">
             <Info className="h-4 w-4 text-amber-600" />
             <AlertDescription className="text-[11px] font-bold text-amber-800">
               Identifícate para completar tu compra de forma segura.
             </AlertDescription>
          </Alert>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-white border border-[#c40000] rounded-[4px] flex gap-3 items-start animate-in fade-in">
            <Triangle className="h-4 w-4 text-[#c40000] fill-[#c40000] mt-1 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-[13px] font-bold text-[#c40000]">Hubo un problema</h4>
              <p className="text-[12px] text-[#111]">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[13px] font-bold text-[#111]">Dirección de e-mail</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="h-8 border-[#888c8c] focus:border-[#e77600] focus:ring-[3px] focus:ring-[#e77600]/20 rounded-[3px] px-2 py-1 text-[13px] font-medium" 
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-[13px] font-bold text-[#111]">Contraseña</Label>
              <Link href="/auth/forgot-password" size="sm" className="text-[12px] text-[#0066c0] hover:text-[#c45500] hover:underline">¿Olvidaste tu contraseña?</Link>
            </div>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="h-8 border-[#888c8c] focus:border-[#e77600] focus:ring-[3px] focus:ring-[#e77600]/20 rounded-[3px] px-2 py-1 text-[13px] font-medium" 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#F2C200] text-[#111] font-normal text-[13px] h-8 rounded-[3px] shadow-[0_2px_5px_0_rgba(213,217,217,.5)] transition-all" 
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar sesión"}
          </Button>

          <p className="text-[12px] text-[#111] leading-snug">
            Al continuar, aceptas las <Link href="#" className="text-[#0066c0] hover:underline hover:text-[#c45500]">Condiciones de uso</Link> y el <Link href="#" className="text-[#0066c0] hover:underline hover:text-[#c45500]">Aviso de privacidad</Link> de Sync Connect.
          </p>
        </form>

        <div className="mt-6 pt-6 border-t border-[#eee] space-y-4">
          <Button 
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full border border-[#d5d9d9] bg-white hover:bg-[#f7fafa] text-[#111] font-normal text-[13px] h-8 rounded-[3px] shadow-[0_2px_5px_0_rgba(213,217,217,.5)] transition-all flex items-center justify-center gap-2"
            disabled={loading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
            </svg>
            Entrar con Google
          </Button>
        </div>
      </Card>

      <div className="w-full max-w-[350px] mt-6">
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#ddd]"></div>
          </div>
          <span className="relative px-2 bg-[#EAEDED] md:bg-[#EAEDED] text-[12px] text-[#767676]">¿Eres nuevo en Sync?</span>
        </div>
        <Button asChild variant="outline" className="w-full border border-[#d5d9d9] bg-white hover:bg-[#f7fafa] text-[#111] font-normal text-[13px] h-8 rounded-[3px] shadow-[0_2px_5px_0_rgba(213,217,217,.5)] transition-all">
          <Link href={`/auth/register${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}>Crea tu cuenta de Sync</Link>
        </Button>
      </div>

      <footer className="mt-12 w-full max-w-xl text-center space-y-4 border-t border-[#eee] pt-8 bg-gradient-to-b from-[#eee] to-transparent bg-[length:100%_1px] bg-no-repeat">
        <div className="flex justify-center gap-8">
          <Link href="#" className="text-[11px] text-[#0066c0] hover:text-[#c45500] hover:underline">Condiciones de uso</Link>
          <Link href="#" className="text-[11px] text-[#0066c0] hover:text-[#c45500] hover:underline">Aviso de privacidad</Link>
          <Link href="#" className="text-[11px] text-[#0066c0] hover:text-[#c45500] hover:underline">Ayuda</Link>
        </div>
        <p className="text-[11px] text-[#555]">© 2024, SyncConnect.com, Inc. o sus afiliados</p>
      </footer>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#EAEDED]"><Loader2 className="animate-spin text-[#FF9900] h-10 w-10" /></div>}>
      <LoginContent />
    </Suspense>
  )
}

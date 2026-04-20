"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Loader2, 
  Image as ImageIcon, 
  ArrowLeft, 
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  Mail,
  Zap,
  Smartphone,
  Settings,
  HelpCircle,
  RefreshCw,
  Info
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useMemoFirebase, useDoc, setDocumentNonBlocking, useUser } from '@/firebase'
import { 
  setPersistence, 
  browserLocalPersistence, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

export default function LoginPage() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { user, isUserLoading: isGlobalLoading } = useUser()
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [authErrorType, setAuthErrorType] = useState<'domain' | 'method' | 'generic' | 'cancelled' | null>(null)
  const [rawErrorCode, setRawErrorCode] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
    
    // 1. VERIFICACIÓN MAESTRA (ADMIN) - PRIORIDAD CRÍTICA
    if (cleanEmail === ADMIN_EMAIL) {
      toast({ title: "Acceso Maestro", description: "Iniciando protocolos administrativos..." });
      window.location.href = '/dashboard/admin';
      return;
    }

    try {
      // 2. VERIFICACIÓN DE AFILIADO
      const affSnap = await getDoc(doc(db, 'affiliates', uid));
      if (affSnap.exists()) {
        toast({ title: "¡Bienvenido Socio!", description: "Accediendo a tu panel Platinum." });
        router.replace('/dashboard/affiliate');
        return;
      }

      // 3. VERIFICACIÓN DE COMPRADOR EXISTENTE
      const buyerSnap = await getDoc(doc(db, 'buyers', uid));
      if (buyerSnap.exists()) {
        toast({ title: "¡Hola!", description: "Entrando a tu área de aprendizaje." });
        router.replace('/dashboard/buyer');
        return;
      }

      // 4. SI NO ES ADMIN NI AFILIADO, CREAMOS PERFIL DE COMPRADOR
      const names = (displayName || 'Usuario Sync').split(' ');
      setDocumentNonBlocking(doc(db, 'buyers', uid), {
        id: uid,
        firstName: names[0] || 'Usuario',
        lastName: names.slice(1).join(' ') || 'Connect',
        email: cleanEmail,
        registeredAt: new Date().toISOString(),
        status: 'Active'
      }, { merge: true });

      toast({ title: "Perfil Vinculado", description: "Accediendo como cliente." });
      router.replace('/dashboard/buyer');

    } catch (err) {
      console.error("Login Success Error:", err);
      router.replace('/dashboard/buyer');
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      toast({ variant: "destructive", title: "Error", description: "El servicio de autenticación no está listo." });
      return;
    }

    setAuthErrorType(null);
    setErrorMsg(null);
    setRawErrorCode(null);
    setLoading(true);
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      
      if (result?.user) {
        await handleLoginSuccess(result.user.email, result.user.uid, result.user.displayName);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Google Login Error:", error.code);
      setLoading(false);
      setRawErrorCode(error.code);

      if (error.code === 'auth/unauthorized-domain') {
        setAuthErrorType('domain');
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthErrorType('method');
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMsg("El navegador bloqueó la ventana de Google. Por favor, permite las ventanas emergentes.");
      } else if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        setAuthErrorType('cancelled');
      } else {
        setErrorMsg("No se pudo conectar con Google. Revisa tu conexión.");
        setAuthErrorType('generic');
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !auth) return;
    setAuthErrorType(null);
    setErrorMsg(null);
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      handleLoginSuccess(result.user.email, result.user.uid, result.user.displayName);
    } catch (error: any) {
      setLoading(false);
      setErrorMsg("Credenciales incorrectas o cuenta no registrada.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 selection:bg-primary/30 transition-colors duration-500">
      
      <div className="fixed top-6 right-6 flex items-center gap-2 z-50">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="mb-10 text-center space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000">
        <Link href="https://syncacademy.systeme.io/sync-connect" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all font-black uppercase text-[10px] tracking-[0.2em] group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Volver al sitio oficial</span>
        </Link>

        <div className="flex flex-col items-center gap-5">
          <div className="relative h-20 w-20 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card ring-8 ring-primary/5 flex items-center justify-center border border-border/50 rotate-3 hover:rotate-0 transition-transform duration-500">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Sync Connect" fill className="object-contain p-3" unoptimized />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="font-headline font-black text-3xl text-foreground tracking-tighter uppercase italic leading-none">
              Sync <span className="text-primary">Connect</span>
            </h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.4em]">Plataforma de Afiliados Elite</p>
          </div>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border-none rounded-[3.5rem] overflow-hidden bg-card p-2 ring-1 ring-border/50 animate-in zoom-in-95 duration-700">
        <div className="bg-muted/30 rounded-[3rem] p-8 md:p-12">
          
          <Tabs defaultValue="google" className="space-y-10">
            <TabsList className="grid grid-cols-2 h-14 bg-card border border-border p-1.5 rounded-2xl shadow-inner">
              <TabsTrigger value="google" className="rounded-xl font-black text-[10px] uppercase gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                <Sparkles className="h-3.5 w-3.5" /> ACCESO GOOGLE
              </TabsTrigger>
              <TabsTrigger value="email" className="rounded-xl font-black text-[10px] uppercase gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all">
                <Mail className="h-3.5 w-3.5" /> EMAIL
              </TabsTrigger>
            </TabsList>

            {/* ERROR DE CANCELACIÓN / POPUP SOLICITADO */}
            {authErrorType === 'cancelled' && (
              <Alert variant="destructive" className="rounded-[2.5rem] bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 p-8 animate-in zoom-in-95 duration-500">
                <RefreshCw className="h-10 w-10 text-amber-600 mb-6 animate-spin-slow" />
                <AlertTitle className="text-sm font-black uppercase mb-4 text-amber-900 dark:text-amber-400 tracking-widest leading-none">Acceso Interrumpido</AlertTitle>
                <AlertDescription className="text-[11px] font-bold leading-relaxed text-amber-800 dark:text-amber-300 space-y-6">
                  <p>Parece que la ventana de Google se cerró antes de tiempo o fue bloqueada por tu navegador.</p>
                  <div className="bg-white/60 dark:bg-black/20 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/30 space-y-4">
                    <p className="mb-2 font-black uppercase text-[9px] flex items-center gap-2">
                      <Info className="h-3 w-3" /> Cómo solucionar:
                    </p>
                    <ul className="space-y-3">
                      <li className="flex gap-2">
                        <span className="h-5 w-5 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 font-black">1</span>
                        <p className="text-[10px]">No cierres la ventana que aparece.</p>
                      </li>
                      <li className="flex gap-2">
                        <span className="h-5 w-5 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 font-black">2</span>
                        <p className="text-[10px]">Asegúrate de elegir una cuenta de Google.</p>
                      </li>
                      <li className="flex gap-2">
                        <span className="h-5 w-5 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px] shrink-0 font-black">3</span>
                        <p className="text-[10px]">Si estás en móvil, intenta abrir el enlace en Chrome o Safari directamente.</p>
                      </li>
                    </ul>
                  </div>
                  <Button onClick={() => setAuthErrorType(null)} variant="outline" className="w-full h-12 rounded-2xl border-amber-200 bg-white hover:bg-amber-100 text-amber-900 font-black text-[10px] uppercase">
                    ENTENDIDO, REINTENTAR
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* ERROR DE DOMINIO */}
            {authErrorType === 'domain' && (
              <Alert variant="destructive" className="rounded-[2rem] bg-red-50 border-red-200 p-6 animate-in zoom-in-95">
                <ShieldAlert className="h-8 w-8 text-red-600 mb-4" />
                <AlertTitle className="text-xs font-black uppercase mb-3 text-red-900 tracking-widest">Dominio no Autorizado</AlertTitle>
                <AlertDescription className="text-[11px] font-bold leading-relaxed text-red-800 space-y-4">
                  <p>Este dominio no tiene permiso para usar Google Auth en Firebase.</p>
                  <div className="bg-white/50 p-4 rounded-xl border border-red-100">
                    <p className="mb-2 font-black uppercase text-[9px]">Solución para el Administrador:</p>
                    <p className="text-[10px]">1. Ve a Firebase Console &gt; Auth &gt; Settings.</p>
                    <p className="text-[10px]">2. En "Authorized domains", añade este dominio.</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {errorMsg && authErrorType !== 'cancelled' && authErrorType !== 'domain' && (
              <Alert variant="destructive" className="rounded-2xl bg-red-50 border-red-100 py-4 animate-in fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[10px] font-black uppercase tracking-widest leading-tight">
                  {errorMsg}
                </AlertDescription>
              </Alert>
            )}

            <TabsContent value="google" className="space-y-8 m-0 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-headline font-black text-foreground tracking-tight uppercase italic">
                  Bienvenido de <span className="text-primary">Nuevo</span>
                </h2>
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                  Entra sin contraseñas en un solo clic
                </p>
              </div>

              <Button 
                className="w-full h-24 rounded-[2.5rem] bg-white hover:bg-slate-50 border-2 border-slate-100 text-slate-900 font-black text-sm shadow-xl transition-all gap-4 group relative overflow-hidden active:scale-95"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {!loading ? (
                  <>
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <svg className="h-8 w-8 group-hover:scale-110 transition-transform duration-500" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>CONTINUAR CON GOOGLE</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Verificando...</span>
                  </div>
                )}
              </Button>

              <div className="grid grid-cols-3 gap-3">
                 {[
                   { icon: ShieldCheck, label: "SEGURO" },
                   { icon: Zap, label: "RÁPIDO" },
                   { icon: Smartphone, label: "MÓVIL" }
                 ].map((item, i) => (
                   <div key={i} className="flex flex-col items-center gap-1.5 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                     <item.icon className="h-4 w-4" />
                     <span className="text-[7px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                   </div>
                 ))}
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-8 m-0 animate-in fade-in zoom-in-95 duration-500">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tu Correo</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="email" 
                        placeholder="ejemplo@correo.com" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 rounded-2xl bg-muted/50 border-none pl-12 pr-6 font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Tu Clave</Label>
                      <Link href="/auth/forgot-password" size="sm" className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Olvidé mi clave</Link>
                    </div>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-14 rounded-2xl bg-muted/50 border-none px-6 font-bold"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>
                <Button onClick={handleEmailLogin} className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-xl" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "INICIAR SESIÓN"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <CardFooter className="justify-center mt-12 p-0 flex flex-col gap-6">
            <p className="text-[10px] font-bold text-muted-foreground uppercase text-center leading-relaxed tracking-widest">
              ¿No tienes cuenta? <Link href="/auth/register" className="text-primary font-black hover:underline block mt-2">Crea tu acceso ahora</Link>
            </p>
            <div className="pt-6 border-t w-full flex justify-center">
               <Link href="/auth/admin-login" className="text-[8px] font-black text-slate-300 hover:text-slate-500 uppercase tracking-[0.5em] transition-colors">CENTRO DE CONTROL MAESTRO</Link>
            </div>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}

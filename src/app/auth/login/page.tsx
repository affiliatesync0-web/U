"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Smartphone
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useMemoFirebase, useDoc, setDocumentNonBlocking } from '@/firebase'
import { 
  setPersistence, 
  browserLocalPersistence, 
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { COUNTRY_CODES } from '@/lib/constants'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function LoginPage() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('google')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [authErrorType, setAuthErrorType] = useState<'domain' | 'generic' | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+505')
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const logoConfigRef = useMemoFirebase(() => db ? doc(db, 'site_config', 'site-logo') : null, [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const EXTERNAL_HOME = 'https://syncacademy.systeme.io/sync-connect';

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && (window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {}
      }
    };
  }, []);

  const setupRecaptcha = (containerId: string) => {
    try {
      if (!auth) return;
      if (typeof window !== "undefined" && (window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => { console.log('reCAPTCHA verified'); },
        'expired-callback': () => {
          toast({ variant: "destructive", title: "Expirado", description: "Reintenta el envío." });
          setLoading(false);
        }
      });
    } catch (error) {
      console.error("reCAPTCHA Error:", error);
    }
  };

  /**
   * Flujo TikTok: Redirección inmediata y creación de cuenta en segundo plano.
   */
  const handleLoginSuccess = async (userEmail: string | null, uid: string, displayName?: string | null) => {
    const ADMIN_EMAIL = 'affiliatesync0@gmail.com';
    const cleanEmail = userEmail?.toLowerCase().trim() || '';
    
    // 1. Acceso Maestro Directo
    if (cleanEmail === ADMIN_EMAIL) {
      toast({ title: "Acceso Maestro", description: "Iniciando centro de mando..." });
      router.push('/dashboard/admin');
      return;
    }

    if (!db) {
      // Si la DB no está lista, intentamos entrar al panel de comprador como fallback seguro
      router.push('/dashboard/buyer');
      return;
    }

    try {
      // 2. Verificar Rol (Optimizado)
      const affSnap = await getDoc(doc(db, 'affiliates', uid));
      if (affSnap.exists()) {
        router.push('/dashboard/affiliate');
        return;
      }

      // 3. Crear Perfil Comprador Automático (Non-blocking)
      const names = displayName?.split(' ') || ['Usuario', 'Sync'];
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || 'Connect';

      setDocumentNonBlocking(doc(db, 'buyers', uid), {
        id: uid,
        firstName,
        lastName,
        email: cleanEmail,
        registeredAt: new Date().toISOString(),
        status: 'Active'
      }, { merge: true });

      toast({ title: "¡Bienvenido!", description: "Entrando a tu panel VIP." });
      
      // Forzamos navegación inmediata
      router.push('/dashboard/buyer');

    } catch (err) {
      console.error("Redirection Error:", err);
      // Ante cualquier error de DB, forzamos la entrada al panel básico
      router.push('/dashboard/buyer');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      toast({ variant: "destructive", title: "Error", description: "Los servicios de seguridad no están listos." });
      return;
    }
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
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Google Login Error:", error.code);
      setLoading(false);
      
      if (error.code === 'auth/unauthorized-domain') {
        setAuthErrorType('domain');
        setErrorMsg("DOMINIO NO AUTORIZADO en Firebase Console.");
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMsg("Popup bloqueado por el navegador.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setErrorMsg("El método de Google no está habilitado en Firebase.");
      } else if (error.code !== 'auth/popup-closed-by-user') {
        setErrorMsg("Fallo al conectar con Google. Revisa tu conexión.");
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
      await handleLoginSuccess(result.user.email, result.user.uid, result.user.displayName);
    } catch (error: any) {
      setLoading(false);
      setErrorMsg("Credenciales incorrectas.");
    }
  };

  const handleSendCode = async () => {
    if (!auth) return;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      toast({ variant: "destructive", title: "Inválido", description: "Ingresa un número real." });
      return;
    }

    setAuthErrorType(null);
    setErrorMsg(null);
    setLoading(true);
    const fullNumber = `${countryCode}${cleanPhone}`;
    
    try {
      setupRecaptcha('recaptcha-container');
      const verifier = (window as any).recaptchaVerifier;
      if (!verifier) throw new Error("reCAPTCHA not initialized");
      
      const result = await signInWithPhoneNumber(auth, fullNumber, verifier);
      setConfirmationResult(result);
      toast({ title: "Código Enviado" });
    } catch (error: any) {
      console.error("SMS Code Error:", error.code);
      if (error.code === 'auth/unauthorized-domain') {
        setAuthErrorType('domain');
        setErrorMsg("DOMINIO NO AUTORIZADO para SMS.");
      } else {
        setErrorMsg("Error al enviar código. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || !confirmationResult || isVerifying) return;
    setIsVerifying(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      await handleLoginSuccess(result.user.email, result.user.uid, result.user.displayName);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Código incorrecto." });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 transition-all duration-500">
      <div id="recaptcha-container"></div>
      
      <div className="fixed top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
          <div className="relative">
            <div className="h-20 w-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Sincronizando identidad...</p>
        </div>
      )}

      <div className="mb-8 text-center space-y-6">
        <Link href={EXTERNAL_HOME} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Volver al sitio oficial</span>
        </Link>

        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16 shadow-2xl rounded-[2rem] overflow-hidden bg-card ring-8 ring-primary/5 flex items-center justify-center border border-border/50">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Sync Connect" width={60} height={60} className="object-contain p-2" unoptimized />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground opacity-20" />
            )}
          </div>
          <span className="font-headline font-black text-2xl text-foreground tracking-tight uppercase italic">Sync <span className="text-primary">Connect</span></span>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-card p-2 ring-1 ring-border/50">
        <div className="bg-muted/30 rounded-[3rem] p-8 md:p-10">
          
          <Tabs defaultValue="google" className="space-y-8" onValueChange={(v) => setActiveTab(v)}>
            <TabsList className="grid grid-cols-2 h-12 bg-card border border-border p-1 rounded-2xl">
              <TabsTrigger value="google" className="rounded-xl font-black text-[10px] uppercase gap-2">
                <Sparkles className="h-3 w-3 text-primary" /> ACCESO RÁPIDO
              </TabsTrigger>
              <TabsTrigger value="others" className="rounded-xl font-black text-[10px] uppercase gap-2">
                <LogIn className="h-3 w-3" /> OTROS
              </TabsTrigger>
            </TabsList>

            <CardHeader className="text-center p-0 space-y-2">
              <CardTitle className="text-2xl font-headline font-black text-foreground tracking-tight uppercase italic">
                {activeTab === 'google' ? 'Entrada' : 'Inicia'} <span className="text-primary">Sesión</span>
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Experiencia instantánea estilo TikTok
              </CardDescription>
            </CardHeader>

            {authErrorType === 'domain' && (
              <Alert variant="destructive" className="rounded-[2rem] bg-red-50 border-red-200 p-6 animate-in zoom-in-95">
                <ShieldAlert className="h-6 w-6 text-red-600" />
                <AlertTitle className="text-xs font-black uppercase mb-2 text-red-900">Error de Dominio</AlertTitle>
                <AlertDescription className="text-[11px] font-bold leading-relaxed text-red-800">
                  Este dominio no está autorizado en tu Firebase Console. <br/><br/>
                  Ve a <b>Authentication &gt; Settings &gt; Authorized domains</b> y añade este dominio para que Google y SMS funcionen.
                </AlertDescription>
              </Alert>
            )}

            {errorMsg && authErrorType !== 'domain' && (
              <Alert variant="destructive" className="rounded-2xl bg-red-50 border-red-100 py-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[11px] font-bold uppercase">{errorMsg}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="google" className="space-y-6 m-0">
              <Button 
                className="w-full h-20 rounded-[2rem] bg-white hover:bg-slate-50 border-2 border-slate-100 text-slate-900 font-black text-xs shadow-xl transition-all gap-4 group"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {!loading ? (
                  <>
                    <svg className="h-6 w-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                    </svg>
                    ENTRAR CON GOOGLE
                  </>
                ) : <Loader2 className="animate-spin h-6 w-6 text-primary" />}
              </Button>
              <p className="text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 leading-relaxed">
                Acceso automático tras elegir tu cuenta. Sin formularios largos.
              </p>
            </TabsContent>

            <TabsContent value="others" className="space-y-10 m-0 animate-in fade-in zoom-in-95">
              <div className="space-y-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="email" className="border-none">
                    <AccordionTrigger className="h-14 bg-card rounded-2xl border px-6 font-black text-[10px] uppercase hover:no-underline">Email & Clave</AccordionTrigger>
                    <AccordionContent className="pt-4 px-2 space-y-4">
                      <div className="space-y-2">
                        <Input 
                          type="email" 
                          placeholder="Tu Email" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 rounded-xl"
                        />
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Contraseña" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 rounded-xl"
                        />
                      </div>
                      <Button onClick={handleEmailLogin} className="w-full h-12 rounded-xl font-black" disabled={loading}>INICIAR</Button>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="phone" className="border-none mt-2">
                    <AccordionTrigger className="h-14 bg-card rounded-2xl border px-6 font-black text-[10px] uppercase hover:no-underline">Número Telefónico</AccordionTrigger>
                    <AccordionContent className="pt-4 px-2">
                      {!confirmationResult ? (
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Select value={countryCode} onValueChange={setCountryCode}>
                              <SelectTrigger className="w-24 h-12 rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>{COUNTRY_CODES.map(c => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>)}</SelectContent>
                            </Select>
                            <Input placeholder="8888 8888" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-xl flex-1" />
                          </div>
                          <Button onClick={handleSendCode} className="w-full h-12 rounded-xl" disabled={loading}>ENVIAR SMS</Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Input placeholder="Código 6 dígitos" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className="h-12 rounded-xl text-center text-xl font-black" />
                          <Button onClick={handleVerifyCode} className="w-full h-12 rounded-xl bg-primary" disabled={isVerifying}>VERIFICAR</Button>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>
          </Tabs>

          <CardFooter className="justify-center mt-10 p-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase text-center leading-relaxed">
              ¿Deseas vender? <Link href="/auth/register/affiliate" className="text-primary font-black hover:underline block mt-1">Aplica para Afiliación Platinum</Link>
            </p>
          </CardFooter>
        </div>
      </Card>
      
      <p className="mt-10 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed text-center max-w-xs">
        Acceso encriptado por Sync Connect.<br/>
        Seguridad de grado militar.
      </p>
    </div>
  )
}

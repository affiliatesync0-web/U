
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
  Mail,
  Smartphone,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldAlert
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase'
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
import { doc, getDoc, setDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { COUNTRY_CODES } from '@/lib/constants'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function LoginPage() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('email')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [authErrorType, setAuthErrorType] = useState<'domain' | 'generic' | null>(null)

  // Estados para Login por Email
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Estados para Login por Teléfono
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+505')
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const EXTERNAL_HOME = 'https://syncacademy.systeme.io/sync-connect';

  useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {}
      }
    };
  }, []);

  const setupRecaptcha = (containerId: string) => {
    try {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => { console.log('reCAPTCHA OK'); },
        'expired-callback': () => {
          toast({ variant: "destructive", title: "reCAPTCHA Expirado", description: "Por favor, intenta de nuevo." });
          setLoading(false);
        }
      });
    } catch (error) {
      console.error("reCAPTCHA Setup Error:", error);
    }
  };

  const handleLoginSuccess = async (userEmail: string | null, uid: string, displayName?: string | null) => {
    const ADMIN_EMAIL = 'affiliatesync0@gmail.com';
    
    try {
      // 1. Verificar si es ADMIN
      if (userEmail?.toLowerCase().trim() === ADMIN_EMAIL) {
        toast({ title: "Acceso Maestro", description: "Iniciando centro de control." });
        router.push('/dashboard/admin');
        return;
      }

      // 2. Verificar si es AFILIADO
      const affSnap = await getDoc(doc(db, 'affiliates', uid));
      if (affSnap.exists()) {
        toast({ title: "Sesión Iniciada", description: "Bienvenido de nuevo, socio." });
        router.push('/dashboard/affiliate');
        return;
      }

      // 3. Verificar si es COMPRADOR
      const buyerSnap = await getDoc(doc(db, 'buyers', uid));
      if (buyerSnap.exists()) {
        toast({ title: "Sesión Iniciada", description: "Accediendo a tus cursos." });
        router.push('/dashboard/buyer');
        return;
      }

      // 4. SI ES NUEVO (TikTok Style): Crear perfil de comprador y entrar
      const names = displayName?.split(' ') || ['Usuario', 'Sync'];
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || 'Connect';

      await setDoc(doc(db, 'buyers', uid), {
        id: uid,
        firstName,
        lastName,
        email: userEmail || '',
        registeredAt: new Date().toISOString(),
        status: 'Active'
      });

      toast({ title: "Cuenta Activada", description: "Bienvenido a Sync Connect." });
      router.push('/dashboard/buyer');

    } catch (err) {
      console.error("Success handling error:", err);
      // Fallback: Si Firestore falla pero el usuario está autenticado, intentamos llevarlo al panel de compras
      toast({ title: "Bienvenido", description: "Sincronizando panel..." });
      router.push('/dashboard/buyer');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthErrorType(null);
    setErrorMsg(null);
    setLoading(true);
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        // Ejecutamos la lógica de redirección inmediatamente
        await handleLoginSuccess(result.user.email, result.user.uid, result.user.displayName);
      }
    } catch (error: any) {
      console.error("Google Login Error:", error.code);
      setLoading(false); // Importante: liberar el botón si hay error
      
      if (error.code !== 'auth/popup-closed-by-user') {
        let msg = "No se pudo conectar con Google.";
        if (error.code === 'auth/unauthorized-domain') {
          setAuthErrorType('domain');
          msg = "DOMINIO NO AUTORIZADO: Debes añadir este dominio a tu Consola de Firebase.";
        }
        setErrorMsg(msg);
        toast({ variant: "destructive", title: "Error Google", description: msg });
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorType(null);
    setErrorMsg(null);
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await handleLoginSuccess(result.user.email, result.user.uid, result.user.displayName);
    } catch (error: any) {
      console.error("Email Login Error:", error.code);
      setLoading(false);
      let msg = "Credenciales inválidas.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = "Correo o contraseña incorrectos.";
      setErrorMsg(msg);
      toast({ variant: "destructive", title: "Error de Acceso", description: msg });
    }
  };

  const handleSendCode = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      toast({ variant: "destructive", title: "Número Inválido", description: "Ingresa un número telefónico válido." });
      return;
    }

    setAuthErrorType(null);
    setErrorMsg(null);
    setLoading(true);
    const fullNumber = `${countryCode}${cleanPhone}`;
    
    try {
      setupRecaptcha('recaptcha-container');
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, fullNumber, verifier);
      setConfirmationResult(result);
      toast({ title: "Código Enviado", description: "Revisa tu teléfono." });
    } catch (error: any) {
      console.error("SMS Error:", error.code);
      let msg = "No se pudo enviar el código.";
      if (error.code === 'auth/unauthorized-domain') {
        setAuthErrorType('domain');
        msg = "DOMINIO NO AUTORIZADO: Añade esta URL a Firebase para habilitar SMS.";
      }
      if (error.code === 'auth/too-many-requests') msg = "Demasiados intentos. Espera unos minutos.";
      setErrorMsg(msg);
      toast({ variant: "destructive", title: "Error SMS", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || !confirmationResult) return;
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      await handleLoginSuccess(result.user.email, result.user.uid, result.user.displayName);
    } catch (error: any) {
      console.error("Verification Error:", error.code);
      toast({ variant: "destructive", title: "Código Inválido", description: "El código ingresado no es correcto." });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 transition-colors duration-300">
      <div id="recaptcha-container"></div>
      
      <div className="fixed top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="mb-8 text-center space-y-6">
        <Link href={EXTERNAL_HOME} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Volver al sitio oficial</span>
        </Link>

        <Link href={EXTERNAL_HOME} className="flex flex-col items-center gap-4 group transition-all">
          <div className="relative h-16 w-16 shadow-2xl rounded-[2rem] overflow-hidden bg-card ring-8 ring-primary/5 flex items-center justify-center border border-border/50">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Sync Connect" width={60} height={60} className="object-contain p-2" unoptimized />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground opacity-20" />
            )}
          </div>
          <span className="font-headline font-black text-2xl text-foreground tracking-tight uppercase italic">Sync <span className="text-primary">Connect</span></span>
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-card p-2 ring-1 ring-border/50">
        <div className="bg-muted/30 rounded-[3rem] p-8 md:p-10">
          
          <Tabs defaultValue="email" onValueChange={(v) => { setActiveTab(v); setErrorMsg(null); setAuthErrorType(null); }} className="space-y-8">
            <TabsList className="grid grid-cols-2 h-12 bg-card border border-border p-1 rounded-2xl">
              <TabsTrigger value="email" className="rounded-xl font-black text-[10px] uppercase gap-2">
                <Mail className="h-3 w-3" /> EMAIL
              </TabsTrigger>
              <TabsTrigger value="phone" className="rounded-xl font-black text-[10px] uppercase gap-2">
                <Smartphone className="h-3 w-3" /> TELÉFONO
              </TabsTrigger>
            </TabsList>

            <CardHeader className="text-center p-0 space-y-2">
              <CardTitle className="text-2xl font-headline font-black text-foreground tracking-tight uppercase italic">
                Entrar a <span className="text-primary">Sync</span>
              </CardTitle>
              <CardDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Acceso instantáneo estilo TikTok
              </CardDescription>
            </CardHeader>

            {authErrorType === 'domain' && (
              <Alert variant="destructive" className="rounded-[2rem] bg-red-50 border-red-200 p-6 animate-in zoom-in-95">
                <ShieldAlert className="h-6 w-6 text-red-600" />
                <AlertTitle className="text-xs font-black uppercase mb-2">Error de Configuración Firebase</AlertTitle>
                <AlertDescription className="text-[11px] font-bold leading-relaxed text-red-800">
                  Google bloqueó el acceso porque este dominio no es de confianza.<br/><br/>
                  <span className="bg-white/50 p-2 rounded-lg block border border-red-100 italic">
                    SOLUCIÓN: Consola Firebase &rarr; Auth &rarr; Settings &rarr; Authorized Domains &rarr; Añadir dominio actual.
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {errorMsg && authErrorType !== 'domain' && (
              <Alert variant="destructive" className="rounded-2xl bg-red-50 border-red-100 py-3 animate-in fade-in zoom-in-95">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[11px] font-bold uppercase leading-tight">{errorMsg}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="email" className="space-y-6 m-0">
              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Tu Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      className="h-14 rounded-2xl bg-card border-none ring-1 ring-border focus:ring-4 focus:ring-primary/10 transition-all font-bold pl-12 pr-6" 
                      placeholder="nombre@ejemplo.com" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Contraseña</Label>
                    <Link href="/auth/forgot-password" size="sm" className="text-[9px] font-black uppercase text-primary hover:underline">¿La olvidaste?</Link>
                  </div>
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
                <Button type="submit" className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "INICIAR SESIÓN"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="phone" className="space-y-6 m-0">
              {!confirmationResult ? (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Número de Teléfono</Label>
                    <div className="flex gap-2">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="w-[110px] h-14 rounded-2xl bg-card border-none ring-1 ring-border font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {COUNTRY_CODES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              <span className="flex items-center gap-2 font-bold text-xs">{c.flag} {c.code}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input 
                        placeholder="8888 8888" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        className="h-14 flex-1 rounded-2xl bg-card border-none ring-1 ring-border focus:ring-4 focus:ring-primary/10 transition-all font-bold px-6"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSendCode} className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl" disabled={loading || !phone}>
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "ENVIAR CÓDIGO"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in zoom-in-95">
                  <div className="space-y-2 text-center">
                    <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Código de Verificación</Label>
                    <Input 
                      placeholder="000000" 
                      value={verificationCode} 
                      onChange={(e) => setVerificationCode(e.target.value)} 
                      className="h-16 rounded-2xl text-center text-3xl font-black tracking-[0.5em] bg-card"
                    />
                  </div>
                  <Button onClick={handleVerifyCode} className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-xl" disabled={isVerifying}>
                    {isVerifying ? <Loader2 className="animate-spin h-5 w-5" /> : "VERIFICAR Y ENTRAR"}
                  </Button>
                  <button onClick={() => setConfirmationResult(null)} className="w-full text-[9px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">Volver a intentar</button>
                </div>
              )}
            </TabsContent>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center text-[8px] font-black uppercase"><span className="bg-muted px-4 text-muted-foreground tracking-[0.3em]">O entra con</span></div>
            </div>

            <Button 
              className="w-full h-16 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-100 text-slate-900 font-black text-xs shadow-lg transition-all gap-3"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading && activeTab === 'email' ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                  </svg>
                  ACCEDER CON GOOGLE
                </>
              )}
            </Button>
          </Tabs>

          <CardFooter className="justify-center mt-10 p-0 flex flex-col gap-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase text-center">
              ¿Quieres ser socio? <Link href="/auth/register/affiliate" className="text-primary font-black hover:underline ml-1">Aplica aquí</Link>
            </p>
          </CardFooter>
        </div>
      </Card>
      
      <p className="mt-10 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed text-center">
        Conexión segura y encriptada por Sync Connect.<br/>
        Al entrar, aceptas nuestros términos y políticas.
      </p>
    </div>
  )
}

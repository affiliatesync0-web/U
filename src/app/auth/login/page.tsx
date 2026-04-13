
"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Image as ImageIcon, 
  Mail, 
  Lock, 
  ArrowLeft, 
  Phone, 
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { sendEmail } from '@/lib/email'
import { COUNTRY_CODES } from '@/lib/constants'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  const [keepLoggedIn, setKeepLoggedIn] = useState(true)

  // Estados para login telefónico
  const [showPhoneLogin, setShowPhoneLogin] = useState(false)
  const [selectedCountryCode, setSelectedCountryCode] = useState('+505')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [phoneStep, setPhoneStep] = useState<'number' | 'code'>('number')
  const [configError, setConfigError] = useState<string | null>(null)

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const EXTERNAL_HOME = 'https://syncacademy.systeme.io/sync-connect';

  const handleLoginSuccess = async (userEmail: string | null, uid: string) => {
    const ADMIN_EMAIL = 'affiliatesync0@gmail.com';
    
    // Alerta silenciosa de acceso
    sendEmail({
      to: ADMIN_EMAIL,
      subject: '🔔 Acceso Detectado',
      text: `Usuario: ${userEmail || 'UID: ' + uid}\nMétodo: Activo\nFecha: ${new Date().toLocaleString()}`
    }).catch(() => {});

    if (userEmail?.toLowerCase().trim() === ADMIN_EMAIL) {
      toast({ title: "Acceso Maestro", description: "Bienvenido al centro de mando." });
      router.push('/dashboard/admin');
    } else {
      const affSnap = await getDoc(doc(db, 'affiliates', uid));
      if (affSnap.exists()) {
        toast({ title: "Bienvenido de nuevo", description: "Sincronizando tus comisiones..." });
        router.push('/dashboard/affiliate');
      } else {
        const buyerSnap = await getDoc(doc(db, 'buyers', uid));
        if (buyerSnap.exists()) {
          toast({ title: "Hola de nuevo", description: "Accediendo a tus cursos adquiridos." });
          router.push('/dashboard/buyer');
        } else {
          toast({ title: "Sesión Iniciada", description: "Por favor, completa tu registro de perfil." });
          router.push('/auth/register');
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
      await setPersistence(auth, keepLoggedIn ? browserLocalPersistence : browserSessionPersistence);
      const result = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass)
      await handleLoginSuccess(cleanEmail, result.user.uid);
    } catch (error: any) {
      console.error("Login Error:", error.code);
      let msg = "Credenciales incorrectas.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        msg = "Email o contraseña no coinciden.";
      }
      toast({ variant: "destructive", title: "Fallo de Acceso", description: msg });
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);
      await handleLoginSuccess(result.user.email, result.user.uid);
    } catch (error: any) {
      console.error("Google Login Error:", error);
      toast({ variant: "destructive", title: "Error Google", description: "No se pudo completar el acceso social." });
      setLoading(false);
    }
  };

  const initRecaptcha = () => {
    try {
      // Limpiar instancia previa si existe
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
      
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          console.log("reCAPTCHA verificado");
        },
        'expired-callback': () => {
          toast({ variant: "destructive", title: "Seguridad Expirada", description: "Por favor, intenta enviar el código de nuevo." });
        }
      });
      
      (window as any).recaptchaVerifier = verifier;
      return verifier;
    } catch (e) {
      console.error("Recaptcha Init Error:", e);
      return null;
    }
  };

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError(null);
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      toast({ variant: "destructive", title: "Número Inválido", description: "Ingresa un número móvil real." });
      return;
    }
    
    const fullNumber = selectedCountryCode + cleanPhone;
    setLoading(true);

    try {
      const verifier = initRecaptcha();
      if (!verifier) throw new Error("Error de inicialización de seguridad.");

      const confirmation = await signInWithPhoneNumber(auth, fullNumber, verifier);
      setConfirmationResult(confirmation);
      setPhoneStep('code');
      toast({ title: "SMS Enviado", description: `Código de seguridad enviado a ${fullNumber}.` });
    } catch (error: any) {
      console.error("Phone Auth Error:", error.code);
      let errorMsg = "No se pudo enviar el SMS.";
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMsg = "El formato del número no es válido.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = "Demasiados intentos. Espera unos minutos.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMsg = "Dominio no autorizado.";
        setConfigError("El dominio affiliatesync.vercel.app no está autorizado en tu consola de Firebase. Añádelo en Auth > Settings > Authorized Domains.");
      }

      toast({ variant: "destructive", title: "Error de SMS", description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || !confirmationResult) return;

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode.trim());
      await handleLoginSuccess(result.user.email, result.user.uid);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Código Inválido", description: "El código es incorrecto o ha expirado." });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 transition-colors duration-300">
      {/* Contenedor ReCaptcha CRÍTICO */}
      <div id="recaptcha-container"></div>
      
      <div className="fixed top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="mb-8 text-center space-y-6">
        <Link href={EXTERNAL_HOME} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Volver a Sync Academy</span>
        </Link>

        <Link href={EXTERNAL_HOME} className="flex flex-col items-center gap-4 group transition-all">
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
          
          <CardHeader className="text-center p-0 mb-8">
            <CardTitle className="text-3xl font-headline font-black text-foreground tracking-tight leading-none uppercase italic">
              {showPhoneLogin ? (
                <>Acceso <span className="text-primary">Teléfono</span></>
              ) : (
                <>Iniciar <span className="text-primary">Sesión</span></>
              )}
            </CardTitle>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-2">
              {showPhoneLogin ? 'Verificación vía SMS' : 'Acceso exclusivo para socios y clientes'}
            </p>
          </CardHeader>

          <CardContent className="p-0 space-y-6">
            {configError && (
              <Alert variant="destructive" className="mb-6 rounded-2xl bg-red-50 border-red-100">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-[10px] font-black uppercase">Nota Técnica</AlertTitle>
                <AlertDescription className="text-[11px] font-medium leading-relaxed">
                  {configError}
                </AlertDescription>
              </Alert>
            )}

            {!showPhoneLogin ? (
              <>
                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Tu Email de Usuario</Label>
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

                  <div className="flex items-center space-x-2 px-1">
                    <Checkbox 
                      id="keepLoggedIn" 
                      checked={keepLoggedIn} 
                      onCheckedChange={(checked) => setKeepLoggedIn(checked as boolean)}
                      className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label 
                      htmlFor="keepLoggedIn" 
                      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer select-none"
                    >
                      Mantener sesión iniciada
                    </label>
                  </div>

                  <Button type="submit" className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "ACCEDER AHORA"}
                  </Button>
                </form>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50"></span></div>
                  <div className="relative flex justify-center text-[9px] uppercase font-black"><span className="bg-muted/30 px-4 text-muted-foreground tracking-widest">O continúa con</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-14 rounded-2xl border-border bg-card font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all gap-3"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-14 rounded-2xl border-border bg-card font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all gap-3"
                    onClick={() => { setShowPhoneLogin(true); setPhoneStep('number'); }}
                    disabled={loading}
                  >
                    <Phone className="h-4 w-4 text-green-500" />
                    Teléfono
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {phoneStep === 'number' ? (
                  <form onSubmit={handleSendPhoneCode} className="space-y-5">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Tu Número Móvil</Label>
                      <div className="flex gap-2">
                        <div className="w-[120px] shrink-0">
                          <Select value={selectedCountryCode} onValueChange={setSelectedCountryCode}>
                            <SelectTrigger className="h-14 rounded-2xl bg-card border-none ring-1 ring-border font-bold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {COUNTRY_CODES.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  <span className="flex items-center gap-2">
                                    <span>{country.flag}</span>
                                    <span>{country.code}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="relative flex-1">
                          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="88888888" 
                            value={phoneNumber} 
                            onChange={e => setPhoneNumber(e.target.value)} 
                            className="h-14 rounded-2xl bg-card border-none ring-1 ring-border pl-12 font-bold text-lg" 
                            required 
                          />
                        </div>
                      </div>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase px-1 leading-relaxed">Selecciona tu país e ingresa el número móvil.</p>
                    </div>
                    <Button type="submit" className="w-full h-16 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest shadow-xl" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : "ENVIAR CÓDIGO SMS"}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowPhoneLogin(false)} className="w-full text-[9px] font-black uppercase text-muted-foreground">Volver al email</Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneCode} className="space-y-5">
                    <div className="space-y-2 text-center">
                      <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto shadow-inner mb-4">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Código de 6 dígitos</Label>
                      <Input 
                        placeholder="000000" 
                        value={verificationCode} 
                        onChange={e => setVerificationCode(e.target.value)} 
                        className="h-16 rounded-2xl bg-card border-none ring-1 ring-border text-center text-3xl font-black tracking-[0.5em]" 
                        required 
                        maxLength={6}
                      />
                    </div>
                    <Button type="submit" className="w-full h-16 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" /> : "VERIFICAR Y ACCEDER"}
                    </Button>
                    <Button variant="ghost" onClick={() => setPhoneStep('number')} className="w-full text-[9px] font-black uppercase text-muted-foreground">Cambiar número</Button>
                  </form>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="justify-center mt-8 p-0 flex flex-col gap-4">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed text-center opacity-50 flex items-center gap-2">
              <ShieldCheck className="h-3 w-3" /> Sistema de Seguridad Sync Activo
            </p>
            {!showPhoneLogin && (
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                ¿No tienes cuenta? <Link href="/auth/register" className="text-primary font-black hover:underline ml-1">Regístrate aquí</Link>
              </p>
            )}
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}

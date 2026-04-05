
"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, EyeOff, Loader2, Image as ImageIcon, ArrowRight, ArrowLeft, AlertCircle, Smartphone, Mail, Hash, Globe } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase'
import { signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { sendEmail } from '@/lib/email'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { COUNTRY_CODES } from '@/lib/constants'

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
  const [errorDetail, setErrorDetail] = useState<string | null>(null)

  // Phone Auth States
  const [countryCode, setCountryCode] = useState('+505')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [step, setStep] = useState<'phone' | 'otp'>('phone')

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  // Función para inicializar o resetear el reCAPTCHA
  const setupRecaptcha = () => {
    try {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          console.log("reCAPTCHA verificado");
        }
      });
    } catch (e) {
      console.error("Error al configurar reCAPTCHA:", e);
    }
  };

  useEffect(() => {
    setupRecaptcha();
    return () => {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
    };
  }, [auth]);

  const handleLoginSuccess = async (userEmail?: string, uid?: string) => {
    const finalUid = uid || auth.currentUser?.uid || '';
    const finalEmail = userEmail || auth.currentUser?.email || 'Usuario Teléfono';

    sendEmail({
      to: 'affiliatesync0@gmail.com',
      subject: '🔔 Nuevo Inicio de Sesión Detectado',
      text: `Detección de acceso en Sync Connect.\n\nFecha: ${new Date().toLocaleString()}\nUsuario: ${finalEmail}\nUID: ${finalUid}`
    }).catch(err => console.warn("Email alert skipped"));

    toast({ title: t.welcomeBack, description: "Accediendo a tu panel..." });
    
    const ADMIN_EMAIL = 'affiliatesync0@gmail.com';
    if (finalEmail.toLowerCase().trim() === ADMIN_EMAIL) {
      router.push('/dashboard/admin');
    } else {
      const affSnap = await getDoc(doc(db, 'affiliates', finalUid));
      if (affSnap.exists()) {
        router.push('/dashboard/affiliate');
      } else {
        const buyerSnap = await getDoc(doc(db, 'buyers', finalUid));
        if (buyerSnap.exists()) {
          router.push('/dashboard/buyer');
        } else {
          toast({ variant: "destructive", title: "Perfil no encontrado", description: "Tu cuenta no tiene un perfil asignado. Contacta a soporte." });
          router.push('/');
        }
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorDetail(null)
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) return;
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, cleanPass)
      await handleLoginSuccess(cleanEmail);
    } catch (error: any) {
      console.error("Email Login Error:", error);
      let msg = "Credenciales incorrectas.";
      if (error.code === 'auth/invalid-credential') msg = "Email o contraseña inválidos.";
      if (error.code === 'auth/user-not-found') msg = "El usuario no existe.";
      setErrorDetail(msg);
      toast({ variant: "destructive", title: "Error de Acceso", description: msg });
      setLoading(false)
    }
  }

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetail(null);
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      toast({ variant: "destructive", title: "Número inválido", description: "Ingresa tu número de teléfono completo." });
      return;
    }

    setLoading(true);
    const fullNumber = `${countryCode}${cleanPhone}`;

    try {
      // Asegurar que el reCAPTCHA esté listo
      if (!(window as any).recaptchaVerifier) {
        setupRecaptcha();
      }
      const appVerifier = (window as any).recaptchaVerifier;
      
      const result = await signInWithPhoneNumber(auth, fullNumber, appVerifier);
      setConfirmationResult(result);
      setStep('otp');
      toast({ title: "Código Enviado", description: `Revisa tus mensajes SMS en el ${fullNumber}.` });
    } catch (error: any) {
      console.error("SMS Auth Error:", error);
      
      // Reset recaptcha on error
      setupRecaptcha();
      
      let msg = "No se pudo enviar el código.";
      if (error.code === 'auth/invalid-phone-number') msg = "El formato del número es incorrecto.";
      if (error.code === 'auth/quota-exceeded') msg = "Se ha excedido el límite de SMS por hoy.";
      if (error.code === 'auth/captcha-check-failed') msg = "La verificación de seguridad falló. Intenta de nuevo.";
      
      setErrorDetail(`${msg} Asegúrate de que el número sea correcto y que tengas habilitado el acceso por teléfono en la consola de Firebase.`);
      toast({ variant: "destructive", title: "Error SMS", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !confirmationResult) return;

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otpCode);
      await handleLoginSuccess(undefined, result.user.uid);
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      toast({ variant: "destructive", title: "Código Incorrecto", description: "El código ingresado no es válido o ha expirado." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 transition-colors duration-300">
      {/* El contenedor debe estar siempre presente y fuera de condicionales complejos */}
      <div id="recaptcha-container"></div>
      
      <div className="fixed top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <div className="fixed top-6 left-6">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black text-[10px] uppercase tracking-widest group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Volver</span>
        </Link>
      </div>

      <Link href="/" className="mb-10 flex flex-col items-center gap-4 group transition-all">
        <div className="relative h-20 w-20 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card ring-8 ring-primary/5 flex items-center justify-center border border-border/50">
           {displayLogoUrl ? (
             <Image src={displayLogoUrl} alt="Sync Connect" width={80} height={80} className="object-contain p-3" unoptimized />
           ) : (
             <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
           )}
        </div>
        <span className="font-headline font-black text-4xl text-foreground tracking-tight uppercase italic">Sync <span className="text-primary">Connect</span></span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-card p-2 ring-1 ring-border/50">
        <div className="bg-muted/30 rounded-[3rem] p-8 md:p-12">
          
          <Tabs defaultValue="phone" className="w-full">
            <TabsList className="grid grid-cols-2 mb-10 h-14 bg-muted p-1 rounded-2xl">
              <TabsTrigger value="phone" className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2">
                <Smartphone className="h-3 w-3" /> Teléfono
              </TabsTrigger>
              <TabsTrigger value="email" className="rounded-xl font-black text-[10px] uppercase tracking-widest gap-2">
                <Mail className="h-3 w-3" /> Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="phone" className="space-y-6">
              <CardHeader className="text-center p-0 mb-6">
                <CardTitle className="text-3xl font-headline font-black text-foreground tracking-tight leading-none uppercase">Acceso <span className="text-primary">WhatsApp</span></CardTitle>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-2">Inicia sesión con tu número de teléfono</p>
              </CardHeader>

              {errorDetail && (
                <Alert variant="destructive" className="mb-4 rounded-2xl bg-red-50 border-red-100">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-bold leading-relaxed">{errorDetail}</AlertDescription>
                </Alert>
              )}

              {step === 'phone' ? (
                <form onSubmit={handleSendPhoneCode} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Tu Número</Label>
                    <div className="flex gap-2">
                      <div className="w-[120px] shrink-0">
                        <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger className="h-14 rounded-2xl bg-card border-none ring-1 ring-border font-bold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {COUNTRY_CODES.map((country) => (
                              <SelectItem key={country.code} value={country.code} className="font-bold">
                                <span className="mr-2">{country.flag}</span> {country.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="relative flex-1">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="tel" 
                          value={phoneNumber} 
                          onChange={(e) => setPhoneNumber(e.target.value)} 
                          required 
                          placeholder="8888 8888"
                          className="h-14 rounded-2xl bg-card border-none ring-1 ring-border focus:ring-4 focus:ring-primary/10 transition-all font-bold pl-12 pr-6" 
                        />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "ENVIAR CÓDIGO SMS"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-2 text-center">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-primary">Ingresa el código de 6 dígitos</Label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={otpCode} 
                        onChange={(e) => setOtpCode(e.target.value)} 
                        required 
                        maxLength={6}
                        className="h-16 rounded-2xl bg-card border-none ring-1 ring-border text-center text-3xl font-black tracking-[0.5em] pl-12" 
                        placeholder="000000"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl bg-slate-900 text-white" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "VERIFICAR Y ENTRAR"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep('phone')} className="w-full text-[9px] font-black uppercase text-muted-foreground">Cambiar Número</Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="email" className="space-y-6">
              <CardHeader className="text-center p-0 mb-6">
                <CardTitle className="text-3xl font-headline font-black text-foreground tracking-tight leading-none uppercase">Acceso <span className="text-primary">Email</span></CardTitle>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-2">Usa tus credenciales tradicionales</p>
              </CardHeader>

              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Tu Email</Label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="h-14 rounded-2xl bg-card border-none ring-1 ring-border focus:ring-4 focus:ring-primary/10 transition-all font-bold px-6" 
                    placeholder="ejemplo@correo.com" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Tu Contraseña</Label>
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
          </Tabs>

          <CardFooter className="justify-center mt-10 p-0 flex flex-col gap-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">¿No tienes cuenta? <Link href="/auth/register" className="text-primary font-black hover:underline ml-1">Regístrate gratis</Link></p>
            <Link href="/auth/admin-login" className="text-[8px] font-black uppercase text-muted-foreground/40 hover:text-foreground transition-colors tracking-[0.3em]">Acceso Maestro Especial</Link>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
}

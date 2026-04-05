
"use client"

import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, Target, Loader2, Smartphone, ShieldCheck, UserCheck, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { sendEmail } from '@/lib/email'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type UserRole = 'affiliate' | 'buyer'
type RegStep = 'role' | 'info' | 'exam'

function RegisterContent() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [role, setRole] = useState<UserRole>('affiliate')
  const [step, setStep] = useState<RegStep>('role')
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  })

  const [examData, setExamData] = useState({ q1: '', q2: '', q3: '' })

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleRegisterSuccess = async (userId: string, data: typeof formData, answers?: any) => {
    const commonData = {
      id: userId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.toLowerCase().trim(),
      whatsappNumber: data.phone.replace(/\D/g, ''),
      registeredAt: new Date().toISOString()
    };

    try {
      if (role === 'affiliate') {
        await setDoc(doc(db, 'affiliates', userId), {
          ...commonData,
          currentBalance: 0,
          status: 'Pending',
          examAnswers: answers || examData
        });

        sendEmail({
          to: 'affiliatesync0@gmail.com',
          subject: '🔔 NUEVA SOLICITUD DE AFILIADO',
          text: `Se ha registrado un nuevo postulante:\n\nNombre: ${data.firstName} ${data.lastName}\nEmail: ${data.email}\n\nRevisa el panel de administración para aprobar esta cuenta.`
        }).catch(e => console.warn("Admin notification skipped:", e.message));

        toast({ title: "Solicitud Enviada", description: "Tu cuenta entrará en fase de revisión técnica." });
        router.push('/dashboard/affiliate');
      } else {
        await setDoc(doc(db, 'buyers', userId), {
          ...commonData,
          status: 'Active'
        });
        toast({ title: "¡Bienvenido!", description: "Tu cuenta de cliente ha sido creada." });
        router.push('/dashboard/buyer');
      }

      sendEmail({
        to: data.email.toLowerCase().trim(),
        subject: '¡Registro Exitoso! - Sync Connect',
        text: `Hola ${data.firstName}, bienvenido a Sync Connect.\n\nTu registro se ha completado correctamente. ${role === 'affiliate' ? 'Tu cuenta está en revisión y te avisaremos cuando sea activada.' : 'Ya puedes explorar nuestro catálogo.'}`
      }).catch(e => console.warn("User welcome email skipped:", e.message));

    } catch (e: any) {
      console.error("CRITICAL FIRESTORE ERROR:", e);
      toast({ 
        variant: "destructive", 
        title: "Error de Guardado", 
        description: "Se creó el acceso pero no pudimos guardar tu perfil. Contacta a soporte." 
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorDetail(null);
    
    if (formData.phone.length < 8) {
      toast({ variant: "destructive", title: "WhatsApp Requerido", description: "Ingresa un número de contacto válido." });
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        await handleRegisterSuccess(auth.currentUser.uid, formData, role === 'affiliate' ? examData : undefined);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, formData.email.toLowerCase().trim(), formData.password);
        await handleRegisterSuccess(cred.user.uid, formData, role === 'affiliate' ? examData : undefined);
      }
    } catch (error: any) {
      console.error("AUTH ERROR:", error.code);
      let msg = "No se pudo completar el registro.";
      if (error.code === 'auth/email-already-in-use') msg = "Este correo ya está registrado.";
      if (error.code === 'auth/weak-password') msg = "La contraseña es muy débil.";
      
      setErrorDetail(msg);
      toast({ variant: "destructive", title: "Fallo en Registro", description: msg });
      setLoading(false);
    }
  }

  const handleGoogleRegister = async (e: React.MouseEvent) => {
    e.preventDefault();
    setGoogleLoading(true);
    setErrorDetail(null);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const affSnap = await getDoc(doc(db, 'affiliates', user.uid));
      const buySnap = await getDoc(doc(db, 'buyers', user.uid));
      
      if (affSnap.exists()) {
        router.push('/dashboard/affiliate');
        return;
      }
      if (buySnap.exists()) {
        router.push('/dashboard/buyer');
        return;
      }

      const [fName, ...lNames] = (user.displayName || '').split(' ');
      setFormData({
        ...formData,
        firstName: fName || '',
        lastName: lNames.join(' ') || '',
        email: user.email || ''
      });
      setStep('info');
    } catch (error: any) {
      console.error("GOOGLE AUTH ERROR:", error.code, error.message);
      let detail = "No se pudo sincronizar tu cuenta de Google.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        detail = "La ventana de Google se cerró sola. Verifica que este dominio esté en 'Dominios Autorizados' en Firebase Console -> Authentication -> Settings.";
      } else if (error.code === 'auth/popup-blocked') {
        detail = "Ventana bloqueada. Por favor, habilita las ventanas emergentes en tu navegador para continuar.";
      } else if (error.code === 'auth/operation-not-allowed') {
        detail = "El acceso con Google está deshabilitado en Firebase Console.";
      } else if (error.code === 'auth/unauthorized-domain') {
        detail = "DOMINIO NO AUTORIZADO: Agrega este dominio en Firebase -> Authentication -> Settings -> Authorized Domains.";
      }
      
      setErrorDetail(detail);
      toast({ variant: "destructive", title: "Error con Google", description: detail });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-4 transition-colors duration-300">
      <div className="fixed top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <Link href="/" className="mb-12 group transition-transform hover:scale-105">
        <div className="h-20 w-20 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card flex items-center justify-center ring-8 ring-primary/5 border border-border/50">
          {displayLogoUrl ? (
            <Image src={displayLogoUrl} alt="Logo" width={80} height={80} className="p-3 object-contain" unoptimized />
          ) : (
            <span className="text-primary text-2xl font-black">SC</span>
          )}
        </div>
      </Link>

      <div className="w-full max-w-4xl">
        {errorDetail && (
          <Alert variant="destructive" className="mb-8 rounded-3xl bg-red-50 border-red-100">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Error Técnico Detectado</AlertTitle>
            <AlertDescription className="text-xs font-bold leading-relaxed">{errorDetail}</AlertDescription>
          </Alert>
        )}

        {step === 'role' && (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center">
              <h1 className="text-5xl font-headline font-black text-foreground tracking-tight leading-none uppercase italic">Crea tu <span className="text-primary">Cuenta</span></h1>
              <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.4em] mt-4">¿Cuál es tu objetivo en Sync Connect?</p>
            </div>

            <div className="flex justify-center mb-4">
              <Button 
                type="button"
                onClick={handleGoogleRegister} 
                variant="outline" 
                className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest gap-3 shadow-xl hover:bg-muted border-none ring-1 ring-border"
                disabled={googleLoading}
              >
                {googleLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.34v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.12z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-1.57z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Registrarme con Google
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button 
                type="button"
                onClick={() => { setRole('buyer'); setStep('info'); }} 
                className="p-12 rounded-[3.5rem] bg-card shadow-2xl hover:ring-8 hover:ring-primary/5 transition-all text-left group border border-border/50 relative overflow-hidden"
              >
                <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 mb-8 group-hover:scale-110 transition-transform shadow-inner">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="text-3xl font-black text-foreground tracking-tight mb-3 uppercase">Quiero comprar</h3>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">Accede a formación y herramientas digitales premium.</p>
              </button>
              <button 
                type="button"
                onClick={() => { setRole('affiliate'); setStep('info'); }} 
                className="p-12 rounded-[3.5rem] bg-card shadow-2xl hover:ring-8 hover:ring-primary/5 transition-all text-left group border border-border/50 relative overflow-hidden"
              >
                <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform shadow-inner">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="text-3xl font-black text-foreground tracking-tight mb-3 uppercase">Quiero vender</h3>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">Únete a nuestra red y genera comisiones reales por venta.</p>
              </button>
            </div>
          </div>
        )}

        {step === 'info' && (
          <Card className="w-full max-w-xl mx-auto border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in slide-in-from-bottom-8 duration-500 ring-1 ring-border/50">
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-3xl font-headline font-black text-foreground tracking-tight leading-none uppercase italic">Tus <span className="text-primary">Datos</span></h2>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-2">{role === 'affiliate' ? 'Registro de Vendedor' : 'Registro de Cliente'}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('role')} className="h-10 rounded-xl font-bold text-[9px] uppercase text-muted-foreground gap-2">
                  <ArrowLeft className="h-3 w-3" /> Volver
                </Button>
              </div>
              
              <form onSubmit={role === 'affiliate' ? (e) => { e.preventDefault(); setStep('exam'); } : handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre</Label>
                    <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border px-5 font-bold" placeholder="Juan" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Apellido</Label>
                    <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border px-5 font-bold" placeholder="Pérez" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">WhatsApp de Contacto <span className="text-primary">*</span></Label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="50588888888" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="pl-12 h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border font-bold" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                  <Input type="email" placeholder="tu@correo.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border px-5 font-bold" disabled={!!auth.currentUser && formData.email !== ''} />
                </div>
                
                {!auth.currentUser && (
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Crea una Contraseña</Label>
                    <Input type="password" placeholder="Mínimo 6 caracteres" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border px-5 font-bold" />
                  </div>
                )}

                <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 mt-4" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (role === 'affiliate' ? <span className="flex items-center gap-2">CONTINUAR <ArrowRight className="h-5 w-5" /></span> : "FINALIZAR REGISTRO")}
                </Button>
              </form>
            </div>
          </Card>
        )}

        {step === 'exam' && (
          <Card className="w-full max-w-xl mx-auto border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in slide-in-from-right-8 duration-500 ring-1 ring-border/50">
            <CardHeader className="p-0 mb-10">
              <CardTitle className="text-3xl font-headline font-black text-primary flex items-center gap-4 leading-none uppercase italic">
                <UserCheck className="h-8 w-8" /> Evaluación
              </CardTitle>
              <p className="text-sm font-medium text-muted-foreground mt-4 leading-relaxed">Queremos conocer tu estrategia antes de activar tu panel.</p>
            </CardHeader>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase text-muted-foreground">¿Cómo planeas promocionar los productos?</Label>
                <Textarea required value={examData.q1} onChange={e => setExamData({...examData, q1: e.target.value})} className="rounded-2xl min-h-[100px] bg-muted/30 border-none ring-1 ring-border p-5 text-sm font-medium" placeholder="Ej: TikTok, Facebook Ads, WhatsApp..." />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase text-muted-foreground">¿Cuál es tu experiencia previa?</Label>
                <Textarea required value={examData.q2} onChange={e => setExamData({...examData, q2: e.target.value})} className="rounded-2xl min-h-[100px] bg-muted/30 border-none ring-1 ring-border p-5 text-sm font-medium" placeholder="Cuéntanos sobre tus resultados anteriores..." />
              </div>
              
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-[2rem] flex items-start gap-4">
                 <ShieldCheck className="h-6 w-6 text-blue-500 shrink-0" />
                 <p className="text-[9px] font-black text-blue-700 dark:text-blue-400 leading-relaxed uppercase tracking-widest">
                   Tu solicitud será auditada por nuestro equipo. Recibirás un aviso en tu Gmail cuando tu panel sea habilitado.
                 </p>
              </div>

              <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "ENVIAR SOLICITUD MAESTRA"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep('info')} className="w-full text-muted-foreground font-black uppercase text-[10px] tracking-widest h-12">Volver a mis datos</Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}

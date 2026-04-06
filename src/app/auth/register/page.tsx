
"use client"

import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, Target, Loader2, Smartphone, Mail, Lock, CheckCircle2, ShieldCheck, Zap, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
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
  const [role, setRole] = useState<UserRole>('affiliate')
  const [step, setStep] = useState<RegStep>('role')
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  })

  const [examData, setExamData] = useState({ q1: '', q2: '', q3: '' })

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleFinalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorDetail(null);

    const cleanEmail = formData.email.toLowerCase().trim();
    const cleanPass = formData.password.trim();

    if (cleanPass.length < 6) {
      toast({ variant: "destructive", title: "Contraseña corta", description: "Debe tener al menos 6 caracteres." });
      setLoading(false);
      return;
    }

    try {
      // 1. Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      const user = userCredential.user;

      const commonData = {
        id: user.uid,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: cleanEmail,
        whatsappNumber: formData.phone.replace(/\D/g, ''),
        registeredAt: new Date().toISOString()
      };

      // 2. Guardar perfil en Firestore
      if (role === 'affiliate') {
        await setDoc(doc(db, 'affiliates', user.uid), {
          ...commonData,
          currentBalance: 0,
          status: 'Pending',
          examAnswers: examData
        });
        toast({ title: "Solicitud Enviada", description: "Tu perfil está en revisión. Te avisaremos por Gmail." });
        router.push('/dashboard/affiliate');
      } else {
        await setDoc(doc(db, 'buyers', user.uid), {
          ...commonData,
          status: 'Active'
        });
        toast({ title: "¡Bienvenido!", description: "Tu cuenta de comprador ha sido creada con éxito." });
        router.push('/dashboard/buyer');
      }

      // 3. Notificar al sistema
      sendEmail({
        to: 'affiliatesync0@gmail.com',
        subject: `🆕 Nuevo Registro: ${role.toUpperCase()}`,
        text: `Un nuevo usuario se ha registrado en la plataforma.\n\nNombre: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}\nRol: ${role}`
      }).catch(() => {});

    } catch (err: any) {
      console.error("Register Error:", err.code);
      let msg = "No pudimos crear tu cuenta en este momento.";
      
      if (err.code === 'auth/email-already-in-use') {
        msg = "Este correo ya está registrado en nuestra red.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "El formato del correo electrónico no es válido.";
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = "El registro por email está desactivado.";
        setErrorDetail("Debes ir a la Consola de Firebase -> Authentication -> Sign-in method y habilitar el proveedor de 'Correo electrónico/contraseña'.");
      } else if (err.code === 'auth/weak-password') {
        msg = "La contraseña es muy débil.";
      }

      toast({ variant: "destructive", title: "Fallo en Registro", description: msg });
    } finally {
      setLoading(false);
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
          <Alert variant="destructive" className="mb-8 rounded-[2rem] bg-red-50 border-red-100 max-w-2xl mx-auto">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-black uppercase text-xs">Error de Configuración</AlertTitle>
            <AlertDescription className="text-sm font-medium leading-relaxed">
              {errorDetail}
            </AlertDescription>
          </Alert>
        )}

        {step === 'role' && (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center">
              <h1 className="text-5xl font-headline font-black text-foreground tracking-tight leading-none uppercase italic">Crea tu <span className="text-primary">Cuenta</span></h1>
              <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.4em] mt-4">Únete a la red líder en Nicaragua</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button type="button" onClick={() => { setRole('buyer'); setStep('info'); }} className="p-12 rounded-[3.5rem] bg-card shadow-2xl hover:ring-8 hover:ring-primary/5 transition-all text-left border border-border/50 group">
                <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 mb-8 group-hover:scale-110 transition-transform"><ShoppingBag className="h-8 w-8" /></div>
                <h3 className="text-3xl font-black text-foreground tracking-tight mb-3 uppercase">Quiero Comprar</h3>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">Accede a formación premium y servicios digitales certificados.</p>
              </button>
              <button type="button" onClick={() => { setRole('affiliate'); setStep('info'); }} className="p-12 rounded-[3.5rem] bg-card shadow-2xl hover:ring-8 hover:ring-primary/5 transition-all text-left border border-border/50 group">
                <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform"><Target className="h-8 w-8" /></div>
                <h3 className="text-3xl font-black text-foreground tracking-tight mb-3 uppercase">Quiero Vender</h3>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">Genera comisiones reales y escala tu negocio digital hoy mismo.</p>
              </button>
            </div>
          </div>
        )}

        {step === 'info' && (
          <Card className="w-full max-w-2xl mx-auto border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in slide-in-from-right-8">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-headline font-black uppercase italic">Tus <span className="text-primary">Datos</span></h2>
                <Button variant="ghost" size="sm" onClick={() => setStep('role')} className="text-[10px] font-black uppercase">Volver</Button>
              </div>
              <form onSubmit={role === 'affiliate' ? (e) => { e.preventDefault(); setStep('exam'); } : handleFinalRegister} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Nombre</Label>
                    <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border px-5 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Apellido</Label>
                    <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border px-5 font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">WhatsApp (Sin +)</Label>
                  <Input placeholder="50588888888" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border px-5 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border px-5 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                  <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="h-14 rounded-2xl bg-muted/30 border-none ring-1 ring-border px-5 font-bold" placeholder="Mínimo 6 caracteres" />
                </div>
                <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : (role === 'affiliate' ? "SIGUIENTE PASO" : "FINALIZAR REGISTRO")}
                </Button>
              </form>
            </div>
          </Card>
        )}

        {step === 'exam' && (
          <Card className="w-full max-w-xl mx-auto border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in slide-in-from-right-8">
            <CardHeader className="p-0 mb-10 text-center">
              <CardTitle className="text-3xl font-headline font-black text-primary uppercase italic">Perfil de Vendedor</CardTitle>
              <p className="text-xs font-bold text-muted-foreground mt-4 uppercase tracking-widest">Breve evaluación para activación</p>
            </CardHeader>
            <form onSubmit={handleFinalRegister} className="space-y-8">
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase text-muted-foreground">¿Cómo planeas promocionar los productos?</Label>
                <Textarea required value={examData.q1} onChange={e => setExamData({...examData, q1: e.target.value})} className="rounded-2xl min-h-[100px] bg-muted/30 border-none ring-1 ring-border p-5 text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase text-muted-foreground">¿Cuál es tu experiencia previa en ventas?</Label>
                <Textarea required value={examData.q2} onChange={e => setExamData({...examData, q2: e.target.value})} className="rounded-2xl min-h-[100px] bg-muted/30 border-none ring-1 ring-border p-5 text-sm font-medium" />
              </div>
              <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "ENVIAR SOLICITUD DE SOCIO"}
              </Button>
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

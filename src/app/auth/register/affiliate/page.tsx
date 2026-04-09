"use client"

import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Target, ArrowLeft, ShieldCheck, AlertCircle, FileCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore } from '@/firebase'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { sendEmail } from '@/lib/email'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { Alert, AlertDescription } from "@/components/ui/alert"

type Step = 'info' | 'kyc' | 'exam'

function AffiliateRegisterContent() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('info')
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  })

  const [kycData, setKycData] = useState({
    idType: 'Cédula de Identidad',
    idNumber: ''
  })

  const [examData, setExamData] = useState({ q1: '', q2: '', q3: 'N/A' })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorDetail(null);

    const cleanEmail = formData.email.toLowerCase().trim();
    const cleanPass = formData.password.trim();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      const user = userCredential.user;

      await setDoc(doc(db, 'affiliates', user.uid), {
        id: user.uid,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: cleanEmail,
        whatsappNumber: formData.phone.replace(/\D/g, ''),
        registeredAt: new Date().toISOString(),
        currentBalance: 0,
        status: 'Pending',
        kyc: kycData,
        examAnswers: examData
      });

      sendEmail({
        to: 'affiliatesync0@gmail.com',
        subject: `🆕 Nueva Solicitud: AFILIADO (KYC)`,
        text: `Un nuevo prospecto de socio se ha registrado.\n\nNombre: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}\nID: ${kycData.idNumber}`
      }).catch(() => {});

      await signOut(auth);
      toast({ title: "Solicitud Enviada", description: "Tu perfil y KYC están en revisión. Inicia sesión para ver tu estado." });
      router.push('/auth/login');

    } catch (err: any) {
      console.error("Affiliate Register Error:", err);
      let msg = "No pudimos procesar tu solicitud.";
      if (err.code === 'auth/email-already-in-use') msg = "Este correo ya está registrado.";
      setErrorDetail(err.code || "Fallo técnico");
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-4">
      <div className="fixed top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <Link href="https://syncacademy.systeme.io/sync-connect" className="mb-10 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Volver a selección</span>
      </Link>

      <div className="w-full max-w-2xl">
        {errorDetail && (
          <Alert variant="destructive" className="mb-6 rounded-2xl bg-red-50 border-red-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-bold">{errorDetail}</AlertDescription>
          </Alert>
        )}

        {step === 'info' && (
          <Card className="border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in slide-in-from-right-4">
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <Target className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-headline font-black uppercase italic">Carrera de <span className="text-primary">Afiliado</span></h2>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">Empieza a ganar comisiones reales hoy</p>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setStep('kyc'); }} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Nombre</Label>
                    <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="h-14 rounded-2xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Apellido</Label>
                    <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required className="h-14 rounded-2xl font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">WhatsApp (Sin +)</Label>
                  <Input placeholder="50588888888" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="h-14 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="h-14 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Contraseña</Label>
                  <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="h-14 rounded-2xl font-bold" />
                </div>
                <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20">
                  SIGUIENTE: VERIFICACIÓN KYC
                </Button>
              </form>
            </div>
          </Card>
        )}

        {step === 'kyc' && (
          <Card className="border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in slide-in-from-right-4">
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                  <FileCheck className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-headline font-black uppercase italic">Verificación <span className="text-blue-600">KYC</span></h2>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">Requerido por regulaciones bancarias de Nicaragua</p>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setStep('exam'); }} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Tipo de Documento</Label>
                    <Select value={kycData.idType} onValueChange={(v) => setKycData({...kycData, idType: v})}>
                      <SelectTrigger className="h-14 rounded-2xl font-bold bg-slate-50 border-none ring-1 ring-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cédula de Identidad">Cédula de Identidad (NI)</SelectItem>
                        <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        <SelectItem value="Residencia">Residencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Número de Identificación</Label>
                    <Input 
                      placeholder="Ej: 001-000000-0000A" 
                      value={kycData.idNumber} 
                      onChange={e => setKycData({...kycData, idNumber: e.target.value.toUpperCase()})} 
                      required 
                      className="h-14 rounded-2xl font-bold uppercase" 
                    />
                  </div>
                </div>
                
                <Alert className="bg-slate-50 border-slate-200 rounded-2xl">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                    Tus datos están protegidos bajo nuestra política de privacidad y se usarán únicamente para la validación de tus pagos de comisiones.
                  </p>
                </Alert>

                <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-200">
                  SIGUIENTE: EVALUACIÓN TÉCNICA
                </Button>
                <Button variant="ghost" className="w-full text-[10px] font-black uppercase" onClick={() => setStep('info')}>Volver</Button>
              </form>
            </div>
          </Card>
        )}

        {step === 'exam' && (
          <Card className="border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in slide-in-from-right-4">
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b pb-6">
                <h2 className="text-2xl font-headline font-black uppercase italic text-primary">Perfil de <span className="text-foreground">Socio</span></h2>
                <Button variant="ghost" size="sm" onClick={() => setStep('kyc')} className="text-[10px] font-black uppercase">Volver</Button>
              </div>
              <form onSubmit={handleRegister} className="space-y-8">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-muted-foreground">¿Cómo planeas promocionar los productos?</Label>
                  <Textarea required value={examData.q1} onChange={e => setExamData({...examData, q1: e.target.value})} className="rounded-2xl min-h-[100px] bg-muted/30 border-none ring-1 ring-border p-5 text-sm font-medium" placeholder="Ej: Redes sociales, anuncios, marketing de guerrilla..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-muted-foreground">¿Cuál es tu experiencia previa en ventas?</Label>
                  <Textarea required value={examData.q2} onChange={e => setExamData({...examData, q2: e.target.value})} className="rounded-2xl min-h-[100px] bg-muted/30 border-none ring-1 ring-border p-5 text-sm font-medium" placeholder="Cuéntanos un poco sobre tus logros anteriores..." />
                </div>
                <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : "ENVIAR SOLICITUD DE AFILIADO"}
                </Button>
              </form>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function AffiliateRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <AffiliateRegisterContent />
    </Suspense>
  )
}

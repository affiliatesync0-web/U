"use client"

import { useState, Suspense, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Target, ArrowLeft, ShieldCheck, AlertCircle, FileCheck, Camera, CheckCircle2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore } from '@/firebase'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { sendEmail } from '@/lib/email'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from '@/lib/utils'

type Step = 'info' | 'kyc' | 'selfie' | 'exam'

function AffiliateRegisterContent() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('info')
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

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

  useEffect(() => {
    if (step === 'selfie') {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({video: true});
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Acceso a Cámara Denegado',
            description: 'Por favor, habilita los permisos de cámara en tu navegador para continuar con el escaneo facial.',
          });
        }
      };

      getCameraPermission();
    }
  }, [step, toast]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUri = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUri);
        // Stop stream
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

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
        photoUrl: capturedPhoto, 
        registeredAt: new Date().toISOString(),
        currentBalance: 0,
        status: 'Pending',
        kyc: kycData,
        examAnswers: examData
      });

      sendEmail({
        to: 'affiliatesync0@gmail.com',
        subject: `🆕 Nueva Solicitud: AFILIADO (Facial Check)`,
        text: `Nuevo socio registrado.\n\nNombre: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}`
      }).catch(() => {});

      await signOut(auth);
      toast({ title: "Solicitud Enviada", description: "Tu perfil y verificación facial están en revisión." });
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
        <span>Volver</span>
      </Link>

      <div className="w-full max-w-2xl">
        {errorDetail && (
          <Alert variant="destructive" className="mb-6 rounded-2xl">
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
                <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl">
                  SIGUIENTE: KYC LEGAL
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
                  <h2 className="text-3xl font-headline font-black uppercase italic">Validación <span className="text-blue-600">ID</span></h2>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">Requerido por regulaciones de pagos</p>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setStep('selfie'); }} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Documento</Label>
                    <Select value={kycData.idType} onValueChange={(v) => setKycData({...kycData, idType: v})}>
                      <SelectTrigger className="h-14 rounded-2xl font-bold bg-slate-50">
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
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Número</Label>
                    <Input 
                      placeholder="Ej: 001-000000-0000A" 
                      value={kycData.idNumber} 
                      onChange={e => setKycData({...kycData, idNumber: e.target.value.toUpperCase()})} 
                      required 
                      className="h-14 rounded-2xl font-bold uppercase" 
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full h-18 rounded-[1.5rem] bg-blue-600 text-white font-black text-lg shadow-xl">
                  SIGUIENTE: ESCANEO FACIAL
                </Button>
                <Button variant="ghost" className="w-full text-[10px] font-black uppercase" onClick={() => setStep('info')}>Volver</Button>
              </form>
            </div>
          </Card>
        )}

        {step === 'selfie' && (
          <Card className="border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in slide-in-from-right-4">
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-16 w-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
                  <Camera className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-headline font-black uppercase italic">Verificación <span className="text-orange-600">Facial</span></h2>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">Coloca tu rostro en el centro del marco</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative aspect-square max-w-[320px] mx-auto rounded-full overflow-hidden bg-slate-900 ring-8 ring-primary/10 shadow-2xl border-4 border-white">
                  <video 
                    ref={videoRef} 
                    className={cn("w-full h-full object-cover", capturedPhoto ? "hidden" : "block")} 
                    autoPlay 
                    muted 
                    playsInline
                  />
                  {capturedPhoto && (
                    <img src={capturedPhoto} alt="Selfie" className="w-full h-full object-cover animate-in fade-in" />
                  )}
                  
                  {!capturedPhoto && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-4/5 h-4/5 border-2 border-dashed border-white/30 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>

                { !(hasCameraPermission) && !capturedPhoto && (
                  <Alert variant="destructive" className="rounded-2xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-[10px] font-black uppercase">Acceso a Cámara Requerido</AlertTitle>
                    <AlertDescription className="text-[11px] font-medium leading-relaxed">
                      Por favor, permite el acceso a la cámara para realizar la validación de identidad.
                    </AlertDescription>
                  </Alert>
                )}

                {!capturedPhoto ? (
                  <Button 
                    onClick={capturePhoto} 
                    disabled={!hasCameraPermission}
                    className="w-full h-18 rounded-[1.5rem] bg-slate-900 text-white font-black text-lg shadow-xl"
                  >
                    TOMAR FOTO DE IDENTIDAD
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <Alert className="bg-green-50 border-green-100 rounded-2xl">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-[10px] font-black text-green-700 uppercase">¡Identidad capturada!</p>
                    </Alert>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" onClick={() => setCapturedPhoto(null)} className="h-14 rounded-2xl font-black text-[10px] uppercase gap-2">
                        <RefreshCw className="h-4 w-4" /> REPETIR
                      </Button>
                      <Button onClick={() => setStep('exam')} className="h-14 rounded-2xl bg-primary text-white font-black text-[10px] uppercase">
                        CONTINUAR
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {step === 'exam' && (
          <Card className="border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in slide-in-from-right-4">
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b pb-6">
                <h2 className="text-2xl font-headline font-black uppercase italic text-primary">Examen <span className="text-foreground">Comercial</span></h2>
                <Button variant="ghost" size="sm" onClick={() => setStep('selfie')} className="text-[10px] font-black uppercase">Volver</Button>
              </div>
              <form onSubmit={handleRegister} className="space-y-8">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-muted-foreground">¿Cómo planeas promocionar los productos?</Label>
                  <Textarea required value={examData.q1} onChange={e => setExamData({...examData, q1: e.target.value})} className="rounded-2xl min-h-[100px] bg-muted/30 p-5" placeholder="Redes sociales, Ads..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-muted-foreground">¿Cuál es tu experiencia en ventas?</Label>
                  <Textarea required value={examData.q2} onChange={e => setExamData({...examData, q2: e.target.value})} className="rounded-2xl min-h-[100px] bg-muted/30 p-5" placeholder="Cuéntanos tus logros..." />
                </div>
                <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl" disabled={loading || !capturedPhoto}>
                  {loading ? <Loader2 className="animate-spin" /> : "ENVIAR SOLICITUD FINAL"}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <AffiliateRegisterContent />
    </Suspense>
  )
}

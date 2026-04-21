
"use client"

import { useState, Suspense, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Target, ArrowLeft, ShieldCheck, AlertCircle, FileCheck, Camera, CheckCircle2, RefreshCw, Scan, UserCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useUser } from '@/firebase'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { sendEmail } from '@/lib/email'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from '@/lib/utils'

type Step = 'info' | 'kyc' | 'id_capture' | 'selfie' | 'exam'

function AffiliateRegisterContent() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { user: existingUser, isUserLoading } = useUser();
  
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('info')
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [capturedID, setCapturedID] = useState<string | null>(null)
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  })

  // Sincronizar datos si el usuario ya inició sesión con Google/SMS
  useEffect(() => {
    if (existingUser && !formData.email) {
      setFormData(prev => ({
        ...prev,
        email: existingUser.email || '',
        phone: existingUser.phoneNumber || '',
        firstName: existingUser.displayName?.split(' ')[0] || '',
        lastName: existingUser.displayName?.split(' ').slice(1).join(' ') || ''
      }));
    }
  }, [existingUser]);

  useEffect(() => {
    if (step === 'id_capture' || step === 'selfie') {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: step === 'id_capture' ? 'environment' : 'user' } 
          });
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Cámara Bloqueada',
            description: 'Necesitamos acceso a la cámara para validar tu identidad.',
          });
        }
      };
      getCameraPermission();
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step, toast]);

  const [kycData, setKycData] = useState({
    idType: 'Cédula de Identidad',
    idNumber: ''
  })

  const [examData, setExamData] = useState({ q1: '', q2: '', q3: 'N/A' })

  const capturePhoto = (isID: boolean) => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUri = canvas.toDataURL('image/jpeg', 0.8);
        if (isID) setCapturedID(dataUri);
        else setCapturedSelfie(dataUri);
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
      let uid = existingUser?.uid;

      // Si no hay usuario autenticado (Google/SMS), creamos uno con Email/Password
      if (!uid) {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
        uid = userCredential.user.uid;
      }

      await setDoc(doc(db, 'affiliates', uid), {
        id: uid,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: cleanEmail,
        whatsappNumber: formData.phone.replace(/\D/g, ''),
        photoUrl: capturedSelfie,
        idPhotoUrl: capturedID,
        registeredAt: new Date().toISOString(),
        currentBalance: 0,
        status: 'Pending',
        kyc: kycData,
        examAnswers: examData
      });

      await sendEmail({
        to: 'affiliatesync0@gmail.com',
        subject: `🆕 Nueva Solicitud Embajador: ${formData.firstName}`,
        text: `Nuevo embajador registrado.\nEmail: ${formData.email}\nID: ${kycData.idNumber}`
      }).catch(() => {});

      // Forzar cierre de sesión para que el admin lo apruebe antes de que entre
      await signOut(auth);
      toast({ title: "Registro Completado", description: "Tu perfil está en revisión. Te avisaremos pronto." });
      router.push('/auth/login');

    } catch (err: any) {
      console.error("Register Error:", err);
      let msg = "Error al crear perfil.";
      if (err.code === 'auth/email-already-in-use') msg = "Este correo ya está registrado.";
      setErrorDetail(err.code || "Fallo técnico");
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-4 transition-all duration-500">
      <div className="fixed top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <Link href="/auth/register" className="mb-10 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Volver a selección</span>
      </Link>

      <div className="w-full max-w-2xl">
        {step === 'info' && (
          <Card className="border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <Target className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-headline font-black uppercase italic">Inscripción de <span className="text-primary">Embajador</span></h2>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">
                    Iniciando configuración de acceso
                  </p>
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
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">WhatsApp</Label>
                  <Input placeholder="50588888888" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="h-14 rounded-2xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={!!existingUser} className="h-14 rounded-2xl font-bold opacity-80" />
                </div>
                
                {!existingUser && (
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Contraseña</Label>
                    <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="h-14 rounded-2xl font-bold" />
                  </div>
                )}

                <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20">
                  CONTINUAR REGISTRO
                </Button>
              </form>
            </div>
          </Card>
        )}

        {step === 'kyc' && (
          <Card className="border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in fade-in slide-in-from-right-4">
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                  <FileCheck className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-headline font-black uppercase italic">Validación <span className="text-blue-600">de Identidad</span></h2>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">Requerido para el desembolso de comisiones</p>
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setStep('id_capture'); }} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Documento de Identidad</Label>
                    <Select value={kycData.idType} onValueChange={(v) => setKycData({...kycData, idType: v})}>
                      <SelectTrigger className="h-14 rounded-2xl font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cédula de Identidad">Cédula de Identidad (NI)</SelectItem>
                        <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                        <SelectItem value="Residencia">Cédula de Residencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Número de Documento</Label>
                    <Input 
                      placeholder="Ej: 001-000000-0000A" 
                      value={kycData.idNumber} 
                      onChange={e => setKycData({...kycData, idNumber: e.target.value.toUpperCase()})} 
                      required 
                      className="h-14 rounded-2xl font-bold uppercase" 
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full h-18 rounded-[1.5rem] bg-blue-600 text-white font-black text-lg shadow-xl shadow-blue-200">
                  ESCANEAR DOCUMENTO
                </Button>
                <Button variant="ghost" className="w-full text-[10px] font-black uppercase" onClick={() => setStep('info')}>Volver</Button>
              </form>
            </div>
          </Card>
        )}

        {(step === 'id_capture' || step === 'selfie') && (
          <Card className="border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in fade-in zoom-in-95">
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shadow-inner", 
                  step === 'id_capture' ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600")}>
                  {step === 'id_capture' ? <Scan className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
                </div>
                <div>
                  <h2 className="text-3xl font-headline font-black uppercase italic">
                    {step === 'id_capture' ? 'Captura de ' : 'Escaneo '}
                    <span className={step === 'id_capture' ? 'text-purple-600' : 'text-orange-600'}>
                      {step === 'id_capture' ? 'Documento' : 'Facial'}
                    </span>
                  </h2>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">
                    {step === 'id_capture' ? 'Muestra el frente de tu documento al lente' : 'Coloca tu rostro en el centro del marco'}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className={cn(
                  "relative aspect-video mx-auto overflow-hidden bg-slate-900 ring-8 ring-slate-100 shadow-2xl border-4 border-white transition-all duration-700",
                  step === 'id_capture' ? "rounded-[2rem]" : "rounded-full aspect-square max-w-[320px]"
                )}>
                  <video 
                    ref={videoRef} 
                    className={cn("w-full h-full object-cover", (step === 'id_capture' ? capturedID : capturedSelfie) ? "hidden" : "block")} 
                    autoPlay 
                    muted 
                    playsInline
                  />
                  {(step === 'id_capture' ? capturedID : capturedSelfie) && (
                    <img src={step === 'id_capture' ? capturedID! : capturedSelfie!} alt="Captura" className="w-full h-full object-cover animate-in fade-in duration-500" />
                  )}
                  
                  {!(step === 'id_capture' ? capturedID : capturedSelfie) && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className={cn("border-2 border-dashed border-white/30 animate-pulse", 
                        step === 'id_capture' ? "w-4/5 h-3/5 rounded-xl" : "w-4/5 h-4/5 rounded-full"
                      )} />
                    </div>
                  )}
                </div>

                {hasCameraPermission === false && (
                  <Alert variant="destructive" className="rounded-2xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-[10px] font-black uppercase">Permiso de Cámara Requerido</AlertTitle>
                    <AlertDescription className="text-[11px] font-medium">Por favor habilita la cámara en los ajustes del navegador.</AlertDescription>
                  </Alert>
                )}

                {!(step === 'id_capture' ? capturedID : capturedSelfie) ? (
                  <Button 
                    onClick={() => capturePhoto(step === 'id_capture')} 
                    disabled={!hasCameraPermission}
                    className="w-full h-18 rounded-[1.5rem] bg-slate-900 text-white font-black text-lg shadow-xl shadow-slate-200"
                  >
                    TOMAR FOTOGRAFÍA
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" onClick={() => step === 'id_capture' ? setCapturedID(null) : setCapturedSelfie(null)} className="h-14 rounded-2xl font-black text-[10px] uppercase gap-2">
                        <RefreshCw className="h-4 w-4" /> REPETIR
                      </Button>
                      <Button 
                        onClick={() => setStep(step === 'id_capture' ? 'selfie' : 'exam')} 
                        className="h-14 rounded-2xl bg-primary text-white font-black text-[10px] uppercase shadow-lg shadow-primary/20"
                      >
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
          <Card className="border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in fade-in slide-in-from-right-4">
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b pb-6">
                <h2 className="text-2xl font-headline font-black uppercase italic text-primary">Evaluación <span className="text-foreground">Comercial</span></h2>
                <Button variant="ghost" size="sm" onClick={() => setStep('selfie')} className="text-[10px] font-black uppercase">Volver</Button>
              </div>
              <form onSubmit={handleRegister} className="space-y-8">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-muted-foreground">¿Cómo planeas promocionar los productos?</Label>
                  <Textarea required value={examData.q1} onChange={e => setExamData({...examData, q1: e.target.value})} className="rounded-2xl min-h-[100px] bg-muted/30 p-5 text-[16px]" placeholder="Ej: Publicidad en TikTok, Reels..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-black uppercase text-muted-foreground">¿Cuál es tu experiencia en ventas?</Label>
                  <Textarea required value={examData.q2} onChange={e => setExamData({...examData, q2: e.target.value})} className="rounded-2xl min-h-[100px] bg-muted/30 p-5 text-[16px]" placeholder="Dinos qué has vendido antes..." />
                </div>
                <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20" disabled={loading || !capturedSelfie || !capturedID}>
                  {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "FINALIZAR REGISTRO"}
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

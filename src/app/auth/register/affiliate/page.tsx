"use client"

import { useState, Suspense, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, AlertCircle, RefreshCw, Scan, Camera, Triangle, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useUser } from '@/firebase'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { sendEmail } from '@/lib/email'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from '@/lib/utils'
import { COUNTRY_CODES } from '@/lib/constants'

type Step = 'info' | 'kyc' | 'id_capture' | 'selfie' | 'exam'

function AffiliateRegisterContent() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { user: existingUser } = useUser();
  
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('info')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [capturedID, setCapturedID] = useState<string | null>(null)
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+505',
    phone: '',
    password: ''
  })

  useEffect(() => {
    if (existingUser && !formData.email) {
      setFormData(prev => ({
        ...prev,
        email: existingUser.email || '',
        phone: existingUser.phoneNumber?.replace(/\D/g, '').slice(-8) || '',
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
    setErrorMsg(null);

    const cleanEmail = formData.email.toLowerCase().trim();
    const cleanPass = formData.password.trim();

    try {
      let uid = existingUser?.uid;

      if (!uid) {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
        uid = userCredential.user.uid;
      }

      await setDoc(doc(db, 'affiliates', uid), {
        id: uid,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: cleanEmail,
        whatsappNumber: (formData.countryCode + formData.phone).replace(/\D/g, ''),
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

      await signOut(auth);
      toast({ title: "Registro Completado", description: "Tu perfil está en revisión. Te avisaremos pronto." });
      router.push('/auth/login');

    } catch (err: any) {
      console.error("Register Error:", err);
      let msg = "Error al crear perfil.";
      if (err.code === 'auth/email-already-in-use') msg = "Este correo ya está registrado.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white md:bg-[#EAEDED] flex flex-col items-center pt-8 pb-12 px-4">
      
      {/* LOGO */}
      <div className="mb-4">
        <Link href="/">
          <div className="relative h-12 w-32 md:h-14 md:w-36">
            <span className="text-[#111] font-black text-2xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
          </div>
        </Link>
      </div>

      <Card className="w-full max-w-[450px] border border-[#ddd] shadow-none md:shadow-sm rounded-[4px] bg-white p-6 md:p-8">
        <h1 className="text-[28px] font-normal text-[#111] mb-5 leading-tight">Inscripción de Embajador</h1>

        {errorMsg && (
          <div className="mb-4 p-3 bg-white border border-[#c40000] rounded-[4px] flex gap-3 items-start">
            <Triangle className="h-4 w-4 text-[#c40000] fill-[#c40000] mt-1 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-[13px] font-bold text-[#c40000]">Hubo un problema</h4>
              <p className="text-[12px] text-[#111]">{errorMsg}</p>
            </div>
          </div>
        )}

        <div className="mb-6 flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={cn("h-1 flex-1 rounded-full", 
              (s === 1 && step === 'info') || 
              (s === 2 && step === 'kyc') || 
              (s === 3 && step === 'id_capture') || 
              (s === 4 && step === 'selfie') || 
              (s === 5 && step === 'exam') ? "bg-[#FF9900]" : "bg-slate-100")} 
            />
          ))}
        </div>

        {step === 'info' && (
          <form onSubmit={(e) => { e.preventDefault(); setStep('kyc'); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[13px] font-bold text-[#111]">Nombre</Label>
                <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="amazon-input-h8" />
              </div>
              <div className="space-y-1">
                <Label className="text-[13px] font-bold text-[#111]">Apellido</Label>
                <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required className="amazon-input-h8" />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-[13px] font-bold text-[#111]">Número de móvil (WhatsApp)</Label>
              <div className="flex gap-1">
                <Select value={formData.countryCode} onValueChange={(v) => setFormData({...formData, countryCode: v})}>
                  <SelectTrigger className="w-[85px] h-8 border-[#888c8c] rounded-[3px] px-2 py-1 text-[13px] font-bold bg-[#f0f2f2]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="flex-1 h-8 border-[#888c8c] rounded-[3px] px-2 py-1" placeholder="88888888" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[13px] font-bold text-[#111]">Correo electrónico</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={!!existingUser} className="h-8 border-[#888c8c] rounded-[3px] px-2 py-1" />
            </div>
            
            {!existingUser && (
              <div className="space-y-1">
                <Label className="text-[13px] font-bold text-[#111]">Crear una contraseña</Label>
                <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required placeholder="Al menos 6 caracteres" className="h-8 border-[#888c8c] rounded-[3px] px-2 py-1" />
              </div>
            )}

            <Button type="submit" className="amazon-btn-primary w-full h-8 mt-4">Continuar</Button>
          </form>
        )}

        {step === 'kyc' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <Label className="text-[13px] font-bold text-[#111]">Documento de Identidad</Label>
              <Select value={kycData.idType} onValueChange={(v) => setKycData({...kycData, idType: v})}>
                <SelectTrigger className="h-8 border-[#888c8c] rounded-[3px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cédula de Identidad">Cédula de Identidad (NI)</SelectItem>
                  <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                  <SelectItem value="Residencia">Cédula de Residencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[13px] font-bold text-[#111]">Número de Documento</Label>
              <Input value={kycData.idNumber} onChange={e => setKycData({...kycData, idNumber: e.target.value.toUpperCase()})} required className="h-8 border-[#888c8c] rounded-[3px]" />
            </div>
            <Button onClick={() => setStep('id_capture')} className="amazon-btn-primary w-full h-8">Siguiente: Validar Identidad</Button>
            <Button variant="ghost" onClick={() => setStep('info')} className="w-full text-[12px] text-[#0066c0] hover:underline">Volver</Button>
          </div>
        )}

        {(step === 'id_capture' || step === 'selfie') && (
          <div className="space-y-6">
            <h3 className="text-[16px] font-bold text-[#111]">{step === 'id_capture' ? 'Captura tu documento' : 'Captura tu rostro'}</h3>
            <div className="relative aspect-video bg-slate-900 rounded-md overflow-hidden border border-[#ddd]">
               <video ref={videoRef} className={cn("w-full h-full object-cover", (step === 'id_capture' ? capturedID : capturedSelfie) ? "hidden" : "block")} autoPlay muted playsInline />
               {(step === 'id_capture' ? capturedID : capturedSelfie) && (
                 <img src={step === 'id_capture' ? capturedID! : capturedSelfie!} alt="Captura" className="w-full h-full object-cover" />
               )}
            </div>

            {!(step === 'id_capture' ? capturedID : capturedSelfie) ? (
              <Button onClick={() => capturePhoto(step === 'id_capture')} disabled={!hasCameraPermission} className="amazon-btn-primary w-full h-10">Tomar Foto</Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => step === 'id_capture' ? setCapturedID(null) : setCapturedSelfie(null)} className="h-8 border-[#ddd] text-[11px] font-bold">REPETIR</Button>
                <Button onClick={() => setStep(step === 'id_capture' ? 'selfie' : 'exam')} className="amazon-btn-primary h-8">CONTINUAR</Button>
              </div>
            )}
          </div>
        )}

        {step === 'exam' && (
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[13px] font-bold text-[#111]">¿Cómo planeas promocionar los productos?</Label>
                <Textarea required value={examData.q1} onChange={e => setExamData({...examData, q1: e.target.value})} className="border-[#888c8c] focus:border-[#e77600] min-h-[80px]" placeholder="Ej: Redes sociales, publicidad..." />
              </div>
              <div className="space-y-1">
                <Label className="text-[13px] font-bold text-[#111]">¿Cuál es tu experiencia en ventas?</Label>
                <Textarea required value={examData.q2} onChange={e => setExamData({...examData, q2: e.target.value})} className="border-[#888c8c] focus:border-[#e77600] min-h-[80px]" />
              </div>
            </div>
            <Button type="submit" className="amazon-btn-primary w-full h-10" disabled={loading || !capturedSelfie || !capturedID}>
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "FINALIZAR REGISTRO"}
            </Button>
          </form>
        )}
      </Card>

      <footer className="mt-12 w-full max-w-xl text-center space-y-4 border-t border-[#eee] pt-8 bg-gradient-to-b from-[#eee] to-transparent bg-[length:100%_1px] bg-no-repeat">
        <div className="flex justify-center gap-8">
          <Link href="#" className="text-[11px] text-[#0066c0] hover:text-[#c45500] hover:underline">Condiciones de uso</Link>
          <Link href="#" className="text-[11px] text-[#0066c0] hover:text-[#c45500] hover:underline">Aviso de privacidad</Link>
          <Link href="#" className="text-[11px] text-[#0066c0] hover:text-[#c45500] hover:underline">Ayuda</Link>
        </div>
        <p className="text-[11px] text-[#555]">© 2024, SyncConnect.com, Inc. o sus afiliados</p>
      </footer>
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

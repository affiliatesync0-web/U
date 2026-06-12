
"use client"

import { useState, Suspense, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, AlertTriangle, ChevronRight, Camera, ShieldCheck, ArrowLeft } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useUser, updateDocumentNonBlocking, useMemoFirebase, useDoc } from '@/firebase'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, increment } from 'firebase/firestore'
import { cn, getGoogleDriveDirectLink } from '@/lib/utils'
import { COUNTRY_CODES } from '@/lib/constants'
import placeholderData from '@/app/lib/placeholder-images.json'

type Step = 'info' | 'kyc' | 'id_capture' | 'selfie' | 'exam'

function AffiliateRegisterContent() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user: existingUser } = useUser();
  
  const referralId = searchParams.get('ref')
  
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

  const logoConfigRef = useMemoFirebase(() => db ? doc(db, 'site_config', 'site-logo') : null, [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

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
  }, [existingUser, formData.email]);

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
            description: 'Necesitamos acceso a la cámara para validar tu identidad corporativa.',
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
        referredBy: referralId || null,
        kyc: kycData,
        examAnswers: examData
      });

      if (referralId) {
        try {
          updateDocumentNonBlocking(doc(db, 'affiliates', referralId), {
            currentBalance: increment(1)
          });
          
          await setDoc(doc(db, 'notifications', `${referralId}_referral_${uid}`), {
            userId: referralId,
            title: '🎁 Bono de Referido',
            message: `¡Felicidades! ${formData.firstName} se ha registrado como afiliado con tu link. Has ganado $1.00.`,
            type: 'sale',
            createdAt: new Date().toISOString(),
            isRead: false
          });
        } catch (refError) {
          console.error("Error crediting referral bonus:", refError);
        }
      }

      await signOut(auth);
      toast({ title: "Registro Completado", description: "Inicia tu proceso de activación final." });
      router.push('/auth/register/affiliate/payment');

    } catch (err: any) {
      console.error("Register Error:", err);
      let msg = "Error al crear perfil administrativo.";
      if (err.code === 'auth/email-already-in-use') msg = "Este correo ya está registrado en el sistema.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 py-12">
      <div className="mb-10">
        <Link href="/">
          <div className="relative h-12 w-40 md:h-14 md:w-48">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Logo" fill className="object-contain" unoptimized />
            ) : (
              <span className="text-white font-black text-2xl uppercase italic tracking-tighter">Sync<span className="text-primary">.Connect</span></span>
            )}
          </div>
        </Link>
      </div>

      <Card className="w-full max-w-[480px] border-none shadow-2xl rounded-none bg-white overflow-hidden">
        <div className="bg-slate-900 p-8 text-white text-center">
          <h1 className="text-2xl font-headline font-black uppercase tracking-tight italic">Registro de <span className="text-primary">Embajador</span></h1>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Elite Network Recruitment</p>
        </div>

        <CardContent className="p-8 md:p-10">
          {referralId && (
            <div className="mb-8 p-3 bg-primary/5 border border-primary/10 flex items-center justify-center gap-2">
              <ShieldCheck className="h-3 w-3 text-primary" />
              <p className="text-[9px] font-black uppercase text-primary tracking-widest">Invitación Directa Platinum Detectada</p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-600 flex gap-3 items-start">
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-[10px] font-black uppercase text-red-600">Error de Validación</h4>
                <p className="text-[11px] text-slate-600 font-bold leading-tight">{errorMsg}</p>
              </div>
            </div>
          )}

          <div className="mb-10 flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={cn("h-1 flex-1 transition-all duration-500", 
                ((s === 1 && step === 'info') || 
                 (s === 2 && step === 'kyc') || 
                 (s === 3 && step === 'id_capture') || 
                 (s === 4 && step === 'selfie') || 
                 (s === 5 && step === 'exam')) ? "bg-primary" : "bg-slate-100")} 
              />
            ))}
          </div>

          {step === 'info' && (
            <form onSubmit={(e) => { e.preventDefault(); setStep('kyc'); }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nombre</Label>
                  <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="h-12 rounded-none bg-slate-50 border-slate-200 focus:border-slate-900 font-bold px-4" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Apellido</Label>
                  <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required className="h-12 rounded-none bg-slate-50 border-slate-200 focus:border-slate-900 font-bold px-4" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Número de móvil</Label>
                <div className="flex gap-0 items-stretch">
                  <Select value={formData.countryCode} onValueChange={(v) => setFormData({...formData, countryCode: v})}>
                    <SelectTrigger className="w-[100px] h-12 border-slate-200 border-r-0 rounded-none bg-slate-100 text-[13px] font-black focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map(c => (
                        <SelectItem key={c.code} value={c.code} className="font-bold">{c.code} {c.flag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="flex-1 h-12 rounded-none bg-slate-50 border-slate-200 focus:border-slate-900 font-bold px-4" placeholder="88888888" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Correo electrónico</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required disabled={!!existingUser} className="h-12 rounded-none bg-slate-50 border-slate-200 focus:border-slate-900 font-bold px-4" />
              </div>
              
              {!existingUser && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Definir Contraseña</Label>
                  <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6} className="h-12 rounded-none bg-slate-50 border-slate-200 focus:border-slate-900 font-bold px-4" placeholder="Mínimo 6 caracteres" />
                </div>
              )}

              <Button type="submit" className="w-full h-14 bg-slate-950 hover:bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-none shadow-xl mt-4">CONTINUAR REGISTRO</Button>
            </form>
          )}

          {step === 'kyc' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Documento de Identidad</Label>
                <Select value={kycData.idType} onValueChange={(v) => setKycData({...kycData, idType: v})}>
                  <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-none font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cédula de Identidad">Cédula de Identidad</SelectItem>
                    <SelectItem value="Pasaporte">Pasaporte</SelectItem>
                    <SelectItem value="Residencia">Cédula de Residencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Número de Documento</Label>
                <Input value={kycData.idNumber} onChange={e => setKycData({...kycData, idNumber: e.target.value.toUpperCase()})} required className="h-12 rounded-none bg-slate-50 border-slate-200 font-bold px-4" />
              </div>
              <Button onClick={() => setStep('id_capture')} className="w-full h-14 bg-slate-950 text-white font-black text-[11px] uppercase tracking-widest rounded-none shadow-xl">SIGUIENTE: VALIDACIÓN BIOMÉTRICA</Button>
              <button onClick={() => setStep('info')} className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">Volver al paso anterior</button>
            </div>
          )}

          {(step === 'id_capture' || step === 'selfie') && (
            <div className="space-y-8">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{step === 'id_capture' ? '03. CAPTURA DE DOCUMENTO' : '04. VALIDACIÓN DE ROSTRO'}</h3>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Coloca el documento frente a la cámara de forma clara.</p>
              </div>

              <div className="relative aspect-video bg-slate-900 rounded-none overflow-hidden border-4 border-slate-100 shadow-inner">
                 <video ref={videoRef} className={cn("w-full h-full object-cover", (step === 'id_capture' ? capturedID : capturedSelfie) ? "hidden" : "block")} autoPlay muted playsInline />
                 {(step === 'id_capture' ? capturedID : capturedSelfie) && (
                   <img src={step === 'id_capture' ? capturedID! : capturedSelfie!} alt="Captura" className="w-full h-full object-cover" />
                 )}
              </div>

              {!(step === 'id_capture' ? capturedID : capturedSelfie) ? (
                <Button onClick={() => capturePhoto(step === 'id_capture')} disabled={!hasCameraPermission} className="w-full h-14 bg-primary text-white font-black text-[11px] uppercase tracking-widest rounded-none">
                  <Camera className="mr-2 h-4 w-4" /> TOMAR FOTOGRAFÍA
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => step === 'id_capture' ? setCapturedID(null) : setCapturedSelfie(null)} className="h-12 border-slate-200 rounded-none font-black text-[9px] uppercase">REPETIR FOTO</Button>
                  <Button onClick={() => setStep(step === 'id_capture' ? 'selfie' : 'exam')} className="h-12 bg-slate-950 text-white rounded-none font-black text-[9px] uppercase">CONFIRMAR Y SEGUIR</Button>
                </div>
              )}
            </div>
          )}

          {step === 'exam' && (
            <form onSubmit={handleRegister} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">¿Cómo planeas promocionar los productos?</Label>
                  <Textarea required value={examData.q1} onChange={e => setExamData({...examData, q1: e.target.value})} className="rounded-none bg-slate-50 border-slate-200 focus:border-slate-900 min-h-[100px] text-sm font-medium p-4" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">¿Cuál es tu experiencia en ventas?</Label>
                  <Textarea required value={examData.q2} onChange={e => setExamData({...examData, q2: e.target.value})} className="rounded-none bg-slate-50 border-slate-200 focus:border-slate-900 min-h-[100px] text-sm font-medium p-4" />
                </div>
              </div>
              <Button type="submit" className="w-full h-16 bg-slate-950 hover:bg-slate-900 text-white font-black text-[12px] uppercase tracking-[0.3em] rounded-none shadow-2xl" disabled={loading || !capturedSelfie || !capturedID}>
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "FINALIZAR REGISTRO MAESTRO"}
              </Button>
            </form>
          )}
          
          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              ¿Ya eres socio? <Link href="/auth/login" className="text-primary hover:underline font-black ml-1">INICIAR SESIÓN <ChevronRight className="inline h-3 w-3" /></Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <footer className="mt-12 flex items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
         <ShieldCheck className="h-4 w-4 text-slate-500" /> Protección de Datos Sync Active • Managed Environment
      </footer>
    </div>
  )
}

export default function AffiliateRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex flex-col items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-primary h-12 w-12 mb-4" /><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Iniciando Portal de Reclutamiento...</p></div>}>
      <AffiliateRegisterContent />
    </Suspense>
  )
}

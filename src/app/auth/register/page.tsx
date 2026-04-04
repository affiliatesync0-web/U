"use client"

import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, Target, Loader2, Smartphone, ShieldCheck, UserCheck, ArrowLeft, ArrowRight, Mail } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { sendEmail } from '@/lib/email'

type UserRole = 'affiliate' | 'buyer'
type RegStep = 'role' | 'info' | 'exam'

function RegisterContent() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<UserRole>('affiliate')
  const [step, setStep] = useState<RegStep>('role')
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = formData.phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 8) {
      toast({ variant: "destructive", title: "WhatsApp Requerido", description: "Ingresa un número válido para contactarte." });
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email.toLowerCase().trim(), formData.password);
      const userId = cred.user.uid;

      const commonData = {
        id: userId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email.toLowerCase().trim(),
        whatsappNumber: cleanPhone,
        registeredAt: new Date().toISOString()
      };

      if (role === 'affiliate') {
        await setDoc(doc(db, 'affiliates', userId), {
          ...commonData,
          currentBalance: 0,
          status: 'Pending',
          examAnswers: examData
        });

        // 1. Notificar al afiliado usando el SMTP configurado
        await sendEmail({
          to: formData.email.toLowerCase().trim(),
          subject: '¡Solicitud Recibida! - Sync Connect',
          text: `Hola ${formData.firstName}, hemos recibido tu solicitud para unirte como afiliado.\n\nActualmente tu cuenta está "En Revisión". Nuestro equipo analizará tu estrategia y te notificaremos por este medio en cuanto tu panel sea activado.\n\nGracias por confiar en Sync Connect.`
        });

        // 2. Notificar al Administrador
        const settingsSnap = await getDoc(doc(db, 'site_config', 'settings'));
        const adminEmail = settingsSnap.data()?.smtp_user || 'affiliatesync0@gmail.com';
        
        await sendEmail({
          to: adminEmail,
          subject: '🔔 NUEVA SOLICITUD DE AFILIADO',
          text: `Se ha registrado un nuevo postulante:\n\nNombre: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}\nWhatsApp: ${cleanPhone}\n\nEstrategia: ${examData.q1}\n\nRevisa el panel de administración para aprobar esta cuenta.`
        });

      } else {
        await setDoc(doc(db, 'buyers', userId), {
          ...commonData,
          status: 'Active'
        });
      }
      
      toast({ title: "¡Cuenta Creada!", description: "Iniciando sesión en tu nuevo panel..." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error en Registro", description: error.message });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-12 px-4">
      <Link href="/" className="mb-12 group transition-transform hover:scale-105">
        <div className="h-20 w-20 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center ring-8 ring-primary/5">
          {displayLogoUrl ? (
            <Image src={displayLogoUrl} alt="Logo" width={80} height={80} className="p-3 object-contain" unoptimized />
          ) : (
            <span className="text-primary text-2xl font-black">SC</span>
          )}
        </div>
      </Link>

      {step === 'role' && (
        <div className="w-full max-w-4xl space-y-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center">
            <h1 className="text-5xl font-headline font-black text-slate-900 dark:text-white tracking-tight leading-none">Crea tu Cuenta</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-4">¿Cuál es tu objetivo principal en Sync Connect?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={() => { setRole('buyer'); setStep('info'); }} 
              className="p-12 rounded-[3.5rem] bg-white dark:bg-slate-900 shadow-xl hover:ring-8 hover:ring-primary/5 transition-all text-left group"
            >
              <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 mb-8 group-hover:scale-110 transition-transform shadow-inner">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Quiero comprar</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed">Accede a formación y herramientas digitales de alta calidad.</p>
            </button>
            <button 
              onClick={() => { setRole('affiliate'); setStep('info'); }} 
              className="p-12 rounded-[3.5rem] bg-white dark:bg-slate-900 shadow-xl hover:ring-8 hover:ring-primary/5 transition-all text-left group"
            >
              <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform shadow-inner">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Quiero vender</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed">Únete a nuestra red, recomienda productos y genera comisiones reales.</p>
            </button>
          </div>
        </div>
      )}

      {step === 'info' && (
        <Card className="w-full max-w-xl border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-white dark:bg-slate-900 animate-in slide-in-from-bottom-8 duration-500">
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-headline font-black text-slate-900 dark:text-white tracking-tight leading-none">Tus Datos</h2>
                <p className="text-[9px] font-black uppercase text-primary tracking-widest mt-2">{role === 'affiliate' ? 'Registro de Vendedor' : 'Registro de Cliente'}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep('role')} className="h-10 rounded-xl font-bold text-[9px] uppercase text-slate-400 gap-2">
                <ArrowLeft className="h-3 w-3" /> Cambiar Perfil
              </Button>
            </div>
            
            <form onSubmit={role === 'affiliate' ? (e) => { e.preventDefault(); setStep('exam'); } : handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</Label>
                  <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-5 font-bold" placeholder="Juan" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Apellido</Label>
                  <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-5 font-bold" placeholder="Pérez" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp de Contacto <span className="text-primary">*</span></Label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="50588888888" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                <Input type="email" placeholder="tu@correo.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-5 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Crea una Contraseña</Label>
                <Input type="password" placeholder="Mínimo 6 caracteres" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-5 font-bold" />
              </div>

              <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 mt-4" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (role === 'affiliate' ? <span className="flex items-center gap-2">SIGUIENTE PASO <ArrowRight className="h-5 w-5" /></span> : "FINALIZAR REGISTRO")}
              </Button>
            </form>
          </div>
        </Card>
      )}

      {step === 'exam' && (
        <Card className="w-full max-w-xl border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-white dark:bg-slate-900 animate-in slide-in-from-right-8 duration-500">
          <CardHeader className="p-0 mb-10">
            <CardTitle className="text-3xl font-headline font-black text-primary flex items-center gap-4 leading-none">
              <UserCheck className="h-8 w-8" /> Evaluación
            </CardTitle>
            <p className="text-sm font-medium text-slate-400 mt-4 leading-relaxed">Queremos conocer tu estrategia antes de activar tu panel de ventas.</p>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2"><Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">¿Cómo planeas promocionar nuestros productos?</Label><Textarea required value={examData.q1} onChange={e => setExamData({...examData, q1: e.target.value})} className="rounded-2xl min-h-[100px] bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 p-5 text-sm font-medium" placeholder="TikTok, Facebook Ads, WhatsApp Marketing..." /></div>
            <div className="space-y-2"><Label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">¿Cuál es tu experiencia en el mundo digital?</Label><Textarea required value={examData.q2} onChange={e => setExamData({...examData, q2: e.target.value})} className="rounded-2xl min-h-[100px] bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 p-5 text-sm font-medium" placeholder="Cuéntanos un poco sobre ti..." /></div>
            
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-[2rem] flex items-start gap-4">
               <ShieldCheck className="h-6 w-6 text-blue-500 shrink-0" />
               <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 leading-relaxed uppercase tracking-widest">
                 Tu solicitud será revisada por nuestro equipo. Recibirás un correo desde nuestro Gmail cuando tu cuenta sea habilitada.
               </p>
            </div>

            <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "ENVIAR SOLICITUD"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep('info')} className="w-full text-slate-400 font-bold uppercase text-[10px] tracking-widest">Volver a mis datos</Button>
          </form>
        </Card>
      )}
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}

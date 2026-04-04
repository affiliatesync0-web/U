
"use client"

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, Target, Loader2, Smartphone, ShieldCheck, UserCheck, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase'
import { createUserWithEmailAndPassword, GoogleAuthProvider, getRedirectResult, signInWithRedirect } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'

type UserRole = 'affiliate' | 'buyer'
type RegStep = 'role' | 'info' | 'exam'

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { t } = useLanguage()
  const auth = useAuth()
  const db = useFirestore()
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<UserRole>('affiliate')
  const [step, setStep] = useState<RegStep>('role')
  
  const referralId = searchParams.get('ref')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    bankId: '',
    bankAccountNumber: '',
    bankAccountHolderName: ''
  })

  const [examData, setExamData] = useState({ q1: '', q2: '', q3: '' })

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  // Capturar resultado de Google Auth
  useEffect(() => {
    if (auth && db) {
      getRedirectResult(auth).then(async (result) => {
        if (result?.user) {
          const user = result.user;
          const affSnap = await getDoc(doc(db, 'affiliates', user.uid));
          const buySnap = await getDoc(doc(db, 'buyers', user.uid));

          if (affSnap.exists() || buySnap.exists()) {
            router.replace(affSnap.exists() ? '/dashboard/affiliate' : '/dashboard/buyer');
          } else {
            setFormData(prev => ({
              ...prev,
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              email: user.email || ''
            }));
            setStep('info');
            toast({ title: "Google Conectado", description: "Completa tu número de teléfono para finalizar." });
          }
        }
      }).catch(console.error);
    }
  }, [auth, db, router, toast]);

  const handleGoogleRegister = async () => {
    if (!auth) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo conectar con Google." });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = formData.phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 8) {
      toast({ variant: "destructive", title: "WhatsApp Requerido", description: "Ingresa un número de teléfono válido." });
      return;
    }

    setLoading(true);
    try {
      let userId = auth.currentUser?.uid;
      
      if (!userId) {
        const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        userId = cred.user.uid;
      }

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
          bankId: '',
          bankAccountNumber: '',
          bankAccountHolderName: '',
          currentBalance: 0,
          status: 'Pending',
          examAnswers: examData
        });
        router.replace('/dashboard/affiliate');
      } else {
        await setDoc(doc(db, 'buyers', userId), {
          ...commonData,
          referredBy: referralId || null
        });
        router.replace('/dashboard/buyer');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <Link href="/" className="mb-12 group transition-transform hover:scale-105">
        <div className="h-20 w-20 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white flex items-center justify-center ring-8 ring-primary/5">
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
            <h1 className="text-5xl font-headline font-black text-slate-900 tracking-tight">Bienvenido a Sync</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">Selecciona tu perfil de inicio</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button 
              onClick={() => { setRole('buyer'); setStep('info'); }} 
              className="p-12 rounded-[3.5rem] bg-white shadow-xl hover:ring-8 hover:ring-primary/5 transition-all text-left group"
            >
              <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-8 group-hover:scale-110 transition-transform shadow-inner">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Quiero comprar</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed">Accede a formación y herramientas digitales exclusivas para escalar tu negocio.</p>
            </button>
            <button 
              onClick={() => { setRole('affiliate'); setStep('info'); }} 
              className="p-12 rounded-[3.5rem] bg-white shadow-xl hover:ring-8 hover:ring-primary/5 transition-all text-left group"
            >
              <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform shadow-inner">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Quiero vender</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed">Únete a nuestra red de afiliados, recomienda productos y genera ingresos reales.</p>
            </button>
          </div>
        </div>
      )}

      {step === 'info' && (
        <Card className="w-full max-w-xl border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 animate-in slide-in-from-bottom-8 duration-500">
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-headline font-black text-slate-900 tracking-tight">Tus Datos</h2>
                <p className="text-[9px] font-black uppercase text-primary tracking-widest">{role === 'affiliate' ? 'Perfil de Vendedor' : 'Perfil de Cliente'}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep('role')} className="h-10 rounded-xl font-bold text-[9px] uppercase text-slate-400 gap-2">
                <ArrowLeft className="h-3 w-3" /> Cambiar Rol
              </Button>
            </div>

            {!auth.currentUser && (
              <Button variant="outline" onClick={handleGoogleRegister} disabled={loading} className="w-full h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-3 border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all">
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.27-8.14 3.27-13.41z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/></svg>
                Continuar con Google
              </Button>
            )}
            
            <form onSubmit={role === 'affiliate' ? (e) => { e.preventDefault(); setStep('exam'); } : handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</Label>
                  <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 px-5 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Apellido</Label>
                  <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 px-5 font-bold" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp / Teléfono <span className="text-primary">*</span></Label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="50588888888" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="pl-12 h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold" />
                </div>
              </div>

              {!auth.currentUser && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                    <Input type="email" placeholder="tu@correo.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 px-5 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña</Label>
                    <Input type="password" placeholder="Mínimo 6 caracteres" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 px-5 font-bold" />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (role === 'affiliate' ? <span className="flex items-center gap-2">Siguiente Paso <ArrowRight className="h-5 w-5" /></span> : "Finalizar Registro")}
              </Button>
            </form>
          </div>
        </Card>
      )}

      {step === 'exam' && (
        <Card className="w-full max-w-xl border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 animate-in slide-in-from-right-8 duration-500">
          <CardHeader className="p-0 mb-10">
            <CardTitle className="text-3xl font-headline font-black text-primary flex items-center gap-4">
              <UserCheck className="h-8 w-8" /> Evaluación
            </CardTitle>
            <p className="text-sm font-medium text-slate-400 mt-2">Queremos conocer tu estrategia de ventas antes de activar tu cuenta.</p>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2"><Label className="text-[11px] font-bold text-slate-600">¿Cómo planeas promocionar los productos?</Label><Textarea required value={examData.q1} onChange={e => setExamData({...examData, q1: e.target.value})} className="rounded-2xl min-h-[100px] bg-slate-50 border-none ring-1 ring-slate-100 p-5" /></div>
            <div className="space-y-2"><Label className="text-[11px] font-bold text-slate-600">¿Cuál es tu experiencia en ventas digitales?</Label><Textarea required value={examData.q2} onChange={e => setExamData({...examData, q2: e.target.value})} className="rounded-2xl min-h-[100px] bg-slate-50 border-none ring-1 ring-slate-100 p-5" /></div>
            
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-start gap-4">
               <ShieldCheck className="h-6 w-6 text-blue-500 shrink-0" />
               <p className="text-[10px] font-bold text-blue-700 leading-relaxed">
                 Tu solicitud será revisada por nuestro equipo. Recibirás un correo cuando tu panel de ventas sea habilitado.
               </p>
            </div>

            <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Enviar Solicitud"}
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}

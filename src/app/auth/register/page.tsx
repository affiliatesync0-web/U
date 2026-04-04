
"use client"

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, Target, Loader2, Smartphone, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth'
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

  useEffect(() => {
    if (auth && db) {
      getRedirectResult(auth).then(async (result) => {
        if (result?.user) {
          const user = result.user;
          const affSnap = await getDoc(doc(db, 'affiliates', user.uid));
          const buySnap = await getDoc(doc(db, 'buyers', user.uid));

          if (affSnap.exists() || buySnap.exists()) {
            router.push(affSnap.exists() ? '/dashboard/affiliate' : '/dashboard/buyer');
          } else {
            setFormData(prev => ({
              ...prev,
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              email: user.email || ''
            }));
            setStep('info');
          }
        }
      }).catch(console.error);
    }
  }, [auth, db, router]);

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
      if (auth.currentUser) {
        const user = auth.currentUser;
        const affiliateSnap = await getDoc(doc(db, 'affiliates', user.uid));
        const buyerSnap = await getDoc(doc(db, 'buyers', user.uid));

        if (affiliateSnap.exists() || buyerSnap.exists()) {
          router.push(affiliateSnap.exists() ? '/dashboard/affiliate' : '/dashboard/buyer');
          return;
        }

        setFormData(prev => ({
          ...prev,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          email: user.email || ''
        }));
        setStep('info');
      }
    } catch (error: any) {
      console.warn("Popup blocked, trying redirect...");
      await signInWithRedirect(auth, provider);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) {
      toast({ variant: "destructive", title: "WhatsApp requerido", description: "Es necesario para la comunicación oficial." });
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
        email: formData.email,
        whatsappNumber: formData.phone.replace(/\D/g, ''),
        registeredAt: new Date().toISOString()
      };

      if (role === 'affiliate') {
        await setDoc(doc(db, 'affiliates', userId), {
          ...commonData,
          bankId: formData.bankId || '',
          bankAccountNumber: formData.bankAccountNumber || '',
          bankAccountHolderName: formData.bankAccountHolderName || '',
          currentBalance: 0,
          status: 'Pending',
          examAnswers: examData
        });
        router.push('/dashboard/affiliate');
      } else {
        await setDoc(doc(db, 'buyers', userId), {
          ...commonData,
          referredBy: referralId || null
        });
        router.push('/dashboard/buyer');
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <Link href="/" className="mb-8 group">
        <div className="h-20 w-20 shadow-2xl rounded-[2rem] overflow-hidden bg-white flex items-center justify-center ring-8 ring-primary/5 group-hover:scale-105 transition-all">
          {displayLogoUrl ? (
            <Image src={displayLogoUrl} alt="Logo" width={80} height={80} className="p-3 object-contain" unoptimized />
          ) : (
            <span className="text-primary text-2xl font-black">SC</span>
          )}
        </div>
      </Link>

      <div className="w-full max-w-md text-center mb-10">
        <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight">Bienvenido a Sync</h1>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Crea tu cuenta profesional ahora</p>
      </div>

      {step === 'role' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl animate-in fade-in zoom-in-95 duration-500">
          <button 
            onClick={() => { setRole('buyer'); setStep('info'); }} 
            className="p-10 rounded-[3rem] bg-white shadow-xl hover:ring-8 hover:ring-primary/5 transition-all text-left group"
          >
            <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Quiero comprar</h3>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">Accede a productos digitales exclusivos y gestiona tus accesos.</p>
          </button>
          <button 
            onClick={() => { setRole('affiliate'); setStep('info'); }} 
            className="p-10 rounded-[3rem] bg-white shadow-xl hover:ring-8 hover:ring-primary/5 transition-all text-left group"
          >
            <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform shadow-inner">
              <Target className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Quiero vender</h3>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">Genera ingresos vendiendo productos de terceros y cobra comisiones.</p>
          </button>
        </div>
      )}

      {step === 'info' && (
        <Card className="w-full max-w-xl border-none shadow-2xl rounded-[3rem] p-8 md:p-12 animate-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-8">
            {!auth.currentUser && (
              <>
                <Button variant="outline" onClick={handleGoogleLogin} disabled={loading} className="w-full h-14 rounded-2xl font-bold gap-3 border-slate-200">
                  <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.27-8.14 3.27-13.41z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/></svg>
                  Registro rápido con Google
                </Button>
                <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-[10px] font-black uppercase text-slate-400"><span className="bg-white px-2">O rellena tus datos</span></div></div>
              </>
            )}
            
            <form onSubmit={role === 'affiliate' ? (e) => { e.preventDefault(); setStep('exam'); } : handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</Label>
                  <Input placeholder="Juan" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Apellido</Label>
                  <Input placeholder="Perez" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required className="h-12 rounded-xl" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp / Teléfono</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="50588888888" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="pl-10 h-12 rounded-xl" />
                </div>
              </div>

              {!auth.currentUser && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                    <Input type="email" placeholder="tu@correo.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña</Label>
                    <Input type="password" placeholder="Mínimo 6 caracteres" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="h-12 rounded-xl" />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-95" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : (role === 'affiliate' ? "Continuar al examen" : "Completar Registro")}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep('role')} className="w-full text-slate-400 font-bold uppercase text-[10px] tracking-widest">Volver atrás</Button>
            </form>
          </div>
        </Card>
      )}

      {step === 'exam' && (
        <Card className="w-full max-w-xl border-none shadow-2xl rounded-[3rem] p-10 animate-in slide-in-from-right-4 duration-500">
          <CardHeader className="p-0 mb-8">
            <CardTitle className="text-2xl font-headline font-black text-primary">Evaluación de Afiliado</CardTitle>
            <p className="text-xs font-medium text-slate-400 mt-1">Queremos conocer tu estrategia de ventas.</p>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2"><Label className="text-[11px] font-bold text-slate-600">{t.question1}</Label><Textarea required value={examData.q1} onChange={e => setExamData({...examData, q1: e.target.value})} className="rounded-xl min-h-[80px]" /></div>
            <div className="space-y-2"><Label className="text-[11px] font-bold text-slate-600">{t.question2}</Label><Textarea required value={examData.q2} onChange={e => setExamData({...examData, q2: e.target.value})} className="rounded-xl min-h-[80px]" /></div>
            <div className="space-y-2"><Label className="text-[11px] font-bold text-slate-600">{t.question3}</Label><Textarea required value={examData.q3} onChange={e => setExamData({...examData, q3: e.target.value})} className="rounded-xl min-h-[80px]" /></div>
            
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
               <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
               <p className="text-[10px] font-bold text-blue-700 leading-relaxed">
                 Al enviar esta solicitud, nuestro equipo revisará tus respuestas. Recibirás un correo de activación en las próximas 24h.
               </p>
            </div>

            <Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Finalizar y enviar"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep('info')} className="w-full text-slate-400 font-bold uppercase text-[10px] tracking-widest">Volver</Button>
          </form>
        </Card>
      )}
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}

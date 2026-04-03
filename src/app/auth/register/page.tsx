
"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NICA_BANKS } from '@/lib/constants'
import { ArrowLeft, Eye, EyeOff, ShoppingBag, Target, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { sendEmail } from '@/lib/email'

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
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<UserRole>('affiliate')
  const [step, setStep] = useState<RegStep>('role')
  
  const referralId = searchParams.get('ref')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    bank: '',
    accNumber: '',
    accHolder: ''
  })

  const [examData, setExamData] = useState({ q1: '', q2: '', q3: '' })

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleGoogleLogin = async () => {
    if (!auth || !db) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user) throw new Error("No se pudo obtener información de Google.");

      const affiliateSnap = await getDoc(doc(db, 'affiliates', user.uid));
      const buyerSnap = await getDoc(doc(db, 'buyers', user.uid));

      if (affiliateSnap.exists()) {
        router.push('/dashboard/affiliate');
        return;
      }
      if (buyerSnap.exists()) {
        router.push('/dashboard/buyer');
        return;
      }

      // Registro nuevo respetando el rol visual
      if (role === 'affiliate') {
        await setDoc(doc(db, 'affiliates', user.uid), {
          id: user.uid,
          firstName: user.displayName?.split(' ')[0] || 'Usuario',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || 'Google',
          email: user.email,
          bankId: '',
          bankAccountNumber: '',
          bankAccountHolderName: '',
          currentBalance: 0,
          registeredAt: new Date().toISOString(),
          status: 'Pending'
        });
        router.push('/dashboard/affiliate');
      } else {
        await setDoc(doc(db, 'buyers', user.uid), {
          id: user.uid,
          firstName: user.displayName?.split(' ')[0] || 'Usuario',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || 'Google',
          email: user.email,
          referredBy: referralId || null,
          registeredAt: new Date().toISOString()
        });
        router.push('/dashboard/buyer');
      }

      toast({ title: "Registro exitoso", description: "Bienvenido a Sync Connect." });
    } catch (error: any) {
      let msg = "No se pudo completar el registro.";
      if (error.code === 'auth/popup-closed-by-user') {
        msg = "La ventana se cerró. Asegúrate de permitir las ventanas emergentes en tu navegador.";
      }
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = cred.user

      if (role === 'affiliate') {
        await setDoc(doc(db, 'affiliates', user.uid), {
          id: user.uid,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          bankId: formData.bank,
          bankAccountNumber: formData.accNumber,
          bankAccountHolderName: formData.accHolder,
          currentBalance: 0,
          registeredAt: new Date().toISOString(),
          status: 'Pending', 
          examAnswers: examData
        });
        router.push('/dashboard/affiliate');
      } else {
        await setDoc(doc(db, 'buyers', user.uid), {
          id: user.uid,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          referredBy: referralId || null,
          registeredAt: new Date().toISOString()
        });
        router.push('/dashboard/buyer');
      }
      toast({ title: "Cuenta creada", description: "Bienvenido a bordo." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
      <Link href="/" className="mb-8">
        <div className="h-20 w-20 shadow-2xl rounded-2xl overflow-hidden bg-white flex items-center justify-center">
          {displayLogoUrl ? <Image src={displayLogoUrl} alt="Logo" width={80} height={80} className="p-3 object-contain" unoptimized /> : <span className="text-primary text-2xl font-bold">SC</span>}
        </div>
      </Link>

      <div className="w-full max-w-md text-center mb-10">
        <h1 className="text-4xl font-headline font-black text-slate-900">Únete a Sync Connect</h1>
        <p className="text-slate-500 mt-2">Selecciona tu rol y crea tu cuenta.</p>
      </div>

      {step === 'role' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <button onClick={() => { setRole('buyer'); setStep('info'); }} className="p-10 rounded-[2.5rem] bg-white shadow-xl hover:ring-4 hover:ring-primary/10 transition-all text-left">
            <ShoppingBag className="h-12 w-12 text-primary mb-6" />
            <h3 className="text-2xl font-black text-slate-900">Quiero comprar</h3>
            <p className="text-slate-500 text-sm mt-2">Accede a productos digitales exclusivos.</p>
          </button>
          <button onClick={() => { setRole('affiliate'); setStep('info'); }} className="p-10 rounded-[2.5rem] bg-white shadow-xl hover:ring-4 hover:ring-primary/10 transition-all text-left">
            <Target className="h-12 w-12 text-primary mb-6" />
            <h3 className="text-2xl font-black text-slate-900">Quiero vender</h3>
            <p className="text-slate-500 text-sm mt-2">Gana comisiones recomendando productos.</p>
          </button>
        </div>
      )}

      {step === 'info' && (
        <Card className="w-full max-w-xl border-none shadow-2xl rounded-[3rem] p-8">
          <div className="space-y-6">
            <Button variant="outline" onClick={handleGoogleLogin} disabled={loading} className="w-full h-14 rounded-2xl font-bold gap-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.27-8.14 3.27-13.41z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/></svg>
              Registro con Google
            </Button>
            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">O con email</span></div></div>
            <form onSubmit={role === 'affiliate' ? (e) => { e.preventDefault(); setStep('exam'); } : handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Nombre" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="h-12 rounded-xl" />
                <Input placeholder="Apellido" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required className="h-12 rounded-xl" />
              </div>
              <Input type="email" placeholder="email@ejemplo.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="h-12 rounded-xl" />
              <Input type="password" placeholder="Contraseña (mín. 6)" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="h-12 rounded-xl" />
              {role === 'affiliate' && (
                <div className="space-y-4 pt-4 border-t">
                  <Select onValueChange={v => setFormData({...formData, bank: v})}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selecciona tu banco" /></SelectTrigger>
                    <SelectContent>{NICA_BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Número de Cuenta" value={formData.accNumber} onChange={e => setFormData({...formData, accNumber: e.target.value})} required className="h-12 rounded-xl" />
                  <Input placeholder="Nombre del titular" value={formData.accHolder} onChange={e => setFormData({...formData, accHolder: e.target.value})} required className="h-12 rounded-xl" />
                </div>
              )}
              <Button type="submit" className="w-full h-14 rounded-2xl font-bold text-lg" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : (role === 'affiliate' ? "Continuar al examen" : "Crear mi cuenta")}</Button>
              <Button type="button" variant="ghost" onClick={() => setStep('role')} className="w-full text-slate-400">Volver</Button>
            </form>
          </div>
        </Card>
      )}

      {step === 'exam' && (
        <Card className="w-full max-w-xl border-none shadow-2xl rounded-[3rem] p-10">
          <CardHeader className="p-0 mb-8">
            <CardTitle className="text-2xl font-headline font-black text-primary">Evaluación Técnica</CardTitle>
            <p className="text-sm text-slate-500">Responde brevemente para activar tu cuenta.</p>
          </CardHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2"><Label className="font-bold">{t.question1}</Label><Textarea required value={examData.q1} onChange={e => setExamData({...examData, q1: e.target.value})} className="rounded-xl min-h-[80px]" /></div>
            <div className="space-y-2"><Label className="font-bold">{t.question2}</Label><Textarea required value={examData.q2} onChange={e => setExamData({...examData, q2: e.target.value})} className="rounded-xl min-h-[80px]" /></div>
            <div className="space-y-2"><Label className="font-bold">{t.question3}</Label><Textarea required value={examData.q3} onChange={e => setExamData({...examData, q3: e.target.value})} className="rounded-xl min-h-[80px]" /></div>
            <Button type="submit" className="w-full h-14 rounded-2xl font-bold text-lg" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : "Finalizar registro"}</Button>
            <Button type="button" variant="ghost" onClick={() => setStep('info')} className="w-full text-slate-400">Volver</Button>
          </form>
        </Card>
      )}
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}

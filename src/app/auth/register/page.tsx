
"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NICA_BANKS } from '@/lib/constants'
import { ArrowLeft, Eye, EyeOff, ShoppingBag, Target, Sparkles, ChevronRight, Landmark, ClipboardCheck, Loader2, ShieldCheck } from 'lucide-center'
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
  const initialRole = searchParams.get('role') as UserRole

  useEffect(() => {
    if (initialRole === 'buyer' || referralId) {
      setRole('buyer')
      setStep('info')
    }
  }, [initialRole, referralId])

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    bank: '',
    accNumber: '',
    accHolder: ''
  })

  const [examData, setExamData] = useState({
    q1: '',
    q2: '',
    q3: ''
  })

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (role === 'affiliate') {
      setStep('exam')
    } else {
      handleSubmit(e)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const affiliateSnap = await getDoc(doc(db, 'affiliates', user.uid));
      const buyerSnap = await getDoc(doc(db, 'buyers', user.uid));

      if (affiliateSnap.exists()) {
        toast({ title: "Bienvenido", description: "Accediendo como Afiliado..." });
        router.push('/dashboard/affiliate');
        return;
      }

      if (buyerSnap.exists()) {
        toast({ title: "Bienvenido", description: "Accediendo como Comprador..." });
        router.push('/dashboard/buyer');
        return;
      }

      await setDoc(doc(db, 'buyers', user.uid), {
        id: user.uid,
        firstName: user.displayName?.split(' ')[0] || 'Usuario',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || 'Google',
        email: user.email,
        registeredAt: new Date().toISOString()
      });

      toast({ title: "Registro exitoso", description: "Te hemos registrado como Comprador." });
      router.push('/dashboard/buyer');
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      let msg = "Error al conectar con Google. Por favor, inténtalo de nuevo.";
      if (error.code === 'auth/popup-closed-by-user') msg = "Se cerró la ventana de acceso.";
      
      toast({ 
        variant: "destructive", 
        title: "Error de Registro", 
        description: msg 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Contraseña Corta",
        description: "La contraseña debe tener al menos 6 caracteres."
      })
      return
    }

    setLoading(true)
    
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

        await addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          title: t.welcomeTitle,
          message: t.waitingApprovalMsg,
          type: 'welcome',
          createdAt: new Date().toISOString(),
          isRead: false
        });

        await sendEmail({
          to: formData.email,
          subject: `Confirmación de Registro - Sync Connect`,
          text: `Hola ${formData.firstName}, tu registro de afiliado está en revisión.`
        });

      } else {
        await setDoc(doc(db, 'buyers', user.uid), {
          id: user.uid,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          referredBy: referralId || null,
          registeredAt: new Date().toISOString()
        });

        await addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          title: t.welcomeTitle,
          message: t.welcomeMsg,
          type: 'welcome',
          createdAt: new Date().toISOString(),
          isRead: false
        });

        await sendEmail({
          to: formData.email,
          subject: `Bienvenido a Sync Connect`,
          text: `Hola ${formData.firstName}, bienvenido como comprador.`
        });
      }
      
      toast({
        title: "Registro exitoso",
        description: `Bienvenido a Sync Connect.`,
      })
      
      router.push(role === 'affiliate' ? '/dashboard/affiliate' : '/dashboard/buyer')
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12 px-4 md:py-24">
      <div className="w-full max-w-4xl flex flex-col items-center mb-12">
        <Link href="/" className="group mb-8">
          <div className="relative h-20 w-20 shadow-2xl rounded-[1.5rem] overflow-hidden bg-white ring-8 ring-primary/5 transition-transform group-hover:scale-110 flex items-center justify-center">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Logo" fill className="object-contain p-3" unoptimized />
            ) : (
              <Sparkles className="h-10 w-10 text-primary" />
            )}
          </div>
        </Link>
        <h1 className="text-4xl md:text-5xl font-headline font-black text-slate-900 tracking-tight text-center">
          Crea tu cuenta en <span className="text-primary">Sync Connect</span>
        </h1>
      </div>

      <div className="w-full max-w-md mb-8">
        <Button 
          variant="outline" 
          onClick={handleGoogleLogin}
          className="w-full h-14 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 font-bold gap-3"
          disabled={loading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.27-8.14 3.27-13.41z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
          </svg>
          Registrarse con Google
        </Button>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#F8FAFC] px-2 text-slate-500">O rellena el formulario</span></div>
        </div>
      </div>

      {step === 'role' && !referralId && (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <button onClick={() => { setRole('buyer'); setStep('info'); }} className="p-8 rounded-[2.5rem] border-4 transition-all text-left shadow-2xl bg-white border-white hover:border-slate-200">
            <ShoppingBag className="h-8 w-8 mb-6" />
            <h3 className="font-headline font-black text-2xl">{t.iWantToBuy}</h3>
          </button>
          <button onClick={() => { setRole('affiliate'); setStep('info'); }} className="p-8 rounded-[2.5rem] border-4 transition-all text-left shadow-2xl bg-white border-white hover:border-slate-200">
            <Target className="h-8 w-8 mb-6" />
            <h3 className="font-headline font-black text-2xl">{t.iWantToSell}</h3>
          </button>
        </div>
      )}

      {step === 'info' && (
        <Card className="w-full max-w-2xl border-none shadow-2xl rounded-[3.5rem] bg-white">
          <CardContent className="p-10">
            <form onSubmit={handleNextStep} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Nombre" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required />
                <Input placeholder="Apellido" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required />
              </div>
              <Input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              <Input type="password" placeholder="Contraseña" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              
              {role === 'affiliate' && (
                <div className="space-y-4 pt-4 border-t">
                  <Select onValueChange={(v) => setFormData({...formData, bank: v})}>
                    <SelectTrigger><SelectValue placeholder="Banco" /></SelectTrigger>
                    <SelectContent>
                      {NICA_BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="Número de Cuenta" value={formData.accNumber} onChange={(e) => setFormData({...formData, accNumber: e.target.value})} required />
                  <Input placeholder="Nombre del Titular" value={formData.accHolder} onChange={(e) => setFormData({...formData, accHolder: e.target.value})} required />
                </div>
              )}
              <Button type="submit" className="w-full h-14 rounded-2xl font-bold" disabled={loading}>
                {role === 'affiliate' ? "Siguiente" : "Registrarse"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 'exam' && (
        <Card className="w-full max-w-2xl border-none shadow-2xl rounded-[3.5rem] bg-white">
          <CardContent className="p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>{t.question1}</Label>
                <Textarea required value={examData.q1} onChange={(e) => setExamData({...examData, q1: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t.question2}</Label>
                <Textarea required value={examData.q2} onChange={(e) => setExamData({...examData, q2: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t.question3}</Label>
                <Textarea required value={examData.q3} onChange={(e) => setExamData({...examData, q3: e.target.value})} />
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl font-bold" disabled={loading}>Finalizar</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function RegisterPageWrapper() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RegisterContent />
    </Suspense>
  )
}
    
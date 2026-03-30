
"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NICA_BANKS } from '@/lib/constants'
import { ArrowLeft, Eye, EyeOff, ShoppingBag, Target, Sparkles, ChevronRight, Landmark, User, Mail, ShieldCheck, ClipboardCheck, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, setDocumentNonBlocking, useMemoFirebase, useDoc, addDocumentNonBlocking } from '@/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, collection } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink, cn } from '@/lib/utils'
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

  // Fetch Live Logo
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

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: t.language === 'es' ? "La contraseña debe tener al menos 6 caracteres." : "Password must be at least 6 characters."
      })
      return
    }

    setLoading(true)
    
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = cred.user

      if (role === 'affiliate') {
        const affiliateData = {
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
        }
        const affiliateRef = doc(db, 'affiliates', user.uid)
        setDocumentNonBlocking(affiliateRef, affiliateData, { merge: true })

        // Notificación interna
        const notificationsRef = collection(db, 'notifications')
        addDocumentNonBlocking(notificationsRef, {
          userId: user.uid,
          title: t.welcomeTitle,
          message: t.waitingApprovalMsg,
          type: 'welcome',
          createdAt: new Date().toISOString(),
          isRead: false
        })

        // EMAIL DE BIENVENIDA AFILIADO (REVISIÓN)
        await sendEmail({
          to: formData.email,
          subject: `Solicitud de Afiliado Recibida - Sync Connect`,
          text: `¡Hola ${formData.firstName}! Hemos recibido satisfactoriamente tu registro y las respuestas de tu evaluación.
          
Nuestro equipo administrativo revisará tu perfil en las próximas 24 horas. Recibirás un correo de confirmación en cuanto tu cuenta sea activada para que puedas empezar a usar tu link de divulgación.

¡Estamos ansiosos de trabajar contigo!`
        });

      } else {
        const buyerData = {
          id: user.uid,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          referredBy: referralId || null,
          registeredAt: new Date().toISOString()
        }
        const buyerRef = doc(db, 'buyers', user.uid)
        setDocumentNonBlocking(buyerRef, buyerData, { merge: true })

        // Notificación interna
        const notificationsRef = collection(db, 'notifications')
        addDocumentNonBlocking(notificationsRef, {
          userId: user.uid,
          title: t.welcomeTitle,
          message: t.welcomeMsg,
          type: 'welcome',
          createdAt: new Date().toISOString(),
          isRead: false
        })

        // EMAIL DE BIENVENIDA COMPRADOR
        await sendEmail({
          to: formData.email,
          subject: `Bienvenido a Sync Connect`,
          text: `¡Hola ${formData.firstName}! Gracias por unirte a nuestra plataforma. 
          
Ya puedes acceder a tu panel de comprador para ver nuestro catálogo de soluciones digitales premium y gestionar tus adquisiciones futuras.

Entra aquí: ${window.location.origin}/auth/login`
        });
      }
      
      toast({
        title: t.language === 'es' ? "Registro exitoso" : "Registration successful",
        description: t.language === 'es' ? `¡Bienvenido! Revisa tu correo ${formData.email}.` : `Welcome! Check your email ${formData.email}.`,
      })
      
      router.push(role === 'affiliate' ? '/dashboard/affiliate' : '/dashboard/buyer')
    } catch (error: any) {
      let message = "No se pudo completar el registro."
      if (error.code === 'auth/email-already-in-use') {
        message = "Este correo electrónico ya está en uso."
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-12 px-4 md:py-24">
      {/* Header & Logo */}
      <div className="w-full max-w-4xl flex flex-col items-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <Link href="/" className="group mb-8">
          <div className="relative h-20 w-20 shadow-2xl rounded-[1.5rem] overflow-hidden bg-white ring-8 ring-primary/5 transition-transform group-hover:scale-110 flex items-center justify-center">
            {displayLogoUrl ? (
              <Image 
                src={displayLogoUrl} 
                alt="Logo" 
                fill 
                className="object-contain p-3"
                unoptimized
              />
            ) : (
              <Sparkles className="h-10 w-10 text-primary" />
            )}
          </div>
        </Link>
        <h1 className="text-4xl md:text-5xl font-headline font-black text-slate-900 tracking-tight text-center">
          Crea tu cuenta en <span className="text-primary">Sync Connect</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-4">
          Únete a la nueva era del marketing digital
        </p>
      </div>

      {/* Role Selection */}
      {step === 'role' && !referralId && (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <button 
            onClick={() => { setRole('buyer'); setStep('info'); }}
            className="relative group overflow-hidden p-8 rounded-[2.5rem] border-4 transition-all text-left shadow-2xl bg-white border-white hover:border-slate-200 opacity-60 hover:opacity-100"
          >
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-6 bg-slate-100 text-slate-400">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="font-headline font-black text-2xl text-slate-900 leading-tight">
              {t.iWantToBuy}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Accede a los mejores productos y servicios digitales del mercado.
            </p>
            <div className="mt-6 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-slate-400">
              {t.joinAs} Comprador <ChevronRight className="h-3 w-3" />
            </div>
          </button>

          <button 
            onClick={() => { setRole('affiliate'); setStep('info'); }}
            className="relative group overflow-hidden p-8 rounded-[2.5rem] border-4 transition-all text-left shadow-2xl bg-white border-white hover:border-slate-200 opacity-60 hover:opacity-100"
          >
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-6 bg-slate-100 text-slate-400">
              <Target className="h-8 w-8" />
            </div>
            <h3 className="font-headline font-black text-2xl text-slate-900 leading-tight">
              {t.iWantToSell}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Promociona productos ganadores y escala tus comisiones semanales.
            </p>
            <div className="mt-6 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-slate-400">
              {t.joinAs} Afiliado <ChevronRight className="h-3 w-3" />
            </div>
          </button>
        </div>
      )}

      {/* Registration Form (Step Info) */}
      {step === 'info' && (
        <Card className="w-full max-w-2xl border-none shadow-2xl rounded-[3.5rem] overflow-hidden bg-white animate-in zoom-in-95 duration-500">
          <CardHeader className="pt-16 pb-8 px-10 text-center">
            <CardTitle className="text-3xl font-headline font-black text-slate-900">
              {role === 'affiliate' ? "Datos de Negocio" : "Datos de Acceso"}
            </CardTitle>
            <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-2">
              Paso 1 de {role === 'affiliate' ? '2' : '1'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-12">
            <form onSubmit={handleNextStep} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.firstName}</Label>
                  <input 
                    placeholder="Juan" 
                    required 
                    className="flex h-14 w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.lastName}</Label>
                  <input 
                    placeholder="Perez" 
                    required 
                    className="flex h-14 w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.email}</Label>
                  <input 
                    type="email" 
                    placeholder="juan.perez@email.com" 
                    required 
                    className="flex h-14 w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.password}</Label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••" 
                      required 
                      className="flex h-14 w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold pr-12" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {role === 'affiliate' && (
                <div className="pt-8 border-t border-slate-50 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{t.bankDetails}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.bankName}</Label>
                      <Select required onValueChange={(v) => setFormData({...formData, bank: v})}>
                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold">
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl">
                          {NICA_BANKS.map((bank) => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.accountNumber}</Label>
                      <input 
                        placeholder="1234567890" 
                        required 
                        className="flex h-14 w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold font-mono" 
                        value={formData.accNumber}
                        onChange={(e) => setFormData({...formData, accNumber: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.accountHolder}</Label>
                      <input 
                        placeholder="Nombre completo" 
                        required 
                        className="flex h-14 w-full rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold" 
                        value={formData.accHolder}
                        onChange={(e) => setFormData({...formData, accHolder: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-20 bg-primary hover:bg-primary/90 text-white font-black text-xl rounded-[1.5rem] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" 
                disabled={loading}
              >
                {role === 'affiliate' ? "SIGUIENTE: EVALUACIÓN" : "EMPEZAR AHORA"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-slate-50/50 py-10 flex flex-col items-center border-t border-slate-100">
            <p className="text-sm font-bold text-slate-400">
              {t.language === 'es' ? "¿Ya tienes cuenta?" : "Already have an account?"} 
              <Link href="/auth/login" className="text-primary hover:underline font-black ml-2 uppercase tracking-widest text-[11px]">
                {t.login}
              </Link>
            </p>
            <button onClick={() => setStep('role')} className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
              <ArrowLeft className="h-3 w-3" /> Volver atrás
            </button>
          </CardFooter>
        </Card>
      )}

      {/* Sales Exam (Step Exam) */}
      {step === 'exam' && (
        <Card className="w-full max-w-2xl border-none shadow-2xl rounded-[3.5rem] overflow-hidden bg-white animate-in slide-in-from-right-4 duration-500">
          <CardHeader className="pt-16 pb-8 px-10 text-center bg-slate-900 text-white">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-xl">
                <ClipboardCheck className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-3xl font-headline font-black">{t.salesExam}</CardTitle>
            <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">
              {t.examSubtitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 py-12 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <Label className="text-xs font-black text-slate-700 uppercase tracking-widest">{t.question1}</Label>
                <Textarea 
                  required 
                  placeholder="Describe tus canales y métodos..."
                  value={examData.q1}
                  onChange={(e) => setExamData({...examData, q1: e.target.value})}
                  className="min-h-[100px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 p-6 text-sm font-bold"
                />
              </div>
              <div className="space-y-4">
                <Label className="text-xs font-black text-slate-700 uppercase tracking-widest">{t.question2}</Label>
                <Textarea 
                  required 
                  placeholder="Cuéntanos tus logros previos..."
                  value={examData.q2}
                  onChange={(e) => setExamData({...examData, q2: e.target.value})}
                  className="min-h-[100px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 p-6 text-sm font-bold"
                />
              </div>
              <div className="space-y-4">
                <Label className="text-xs font-black text-slate-700 uppercase tracking-widest">{t.question3}</Label>
                <Textarea 
                  required 
                  placeholder="Escribe tu respuesta de cierre..."
                  value={examData.q3}
                  onChange={(e) => setExamData({...examData, q3: e.target.value})}
                  className="min-h-[100px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 p-6 text-sm font-bold"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-20 bg-primary hover:bg-primary/90 text-white font-black text-xl rounded-[1.5rem] shadow-2xl shadow-primary/30" 
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin h-6 w-6" /> : t.finishExam.toUpperCase()}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center pb-10">
             <button onClick={() => setStep('info')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
               Corregir datos personales
             </button>
          </CardFooter>
        </Card>
      )}

      {/* Trust Badges */}
      <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-40">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900">
          <ShieldCheck className="h-4 w-4" /> Pagos 100% Seguros
        </div>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900">
          <Sparkles className="h-4 w-4" /> Tecnología de Punta
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Sparkles className="h-10 w-10 animate-spin text-primary" /></div>}>
      <RegisterContent />
    </Suspense>
  )
}

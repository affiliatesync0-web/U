
"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NICA_BANKS } from '@/lib/constants'
import { ArrowLeft, Eye, EyeOff, ShoppingBag, Target, Sparkles, ChevronRight, Landmark, User, Mail, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, setDocumentNonBlocking, useMemoFirebase, useDoc, addDocumentNonBlocking } from '@/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, collection } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink, cn } from '@/lib/utils'

type UserRole = 'affiliate' | 'buyer'

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
  
  const referralId = searchParams.get('ref')
  const initialRole = searchParams.get('role') as UserRole

  useEffect(() => {
    if (initialRole === 'buyer' || referralId) {
      setRole('buyer')
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

  // Fetch Live Logo
  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          status: 'Active'
        }
        const affiliateRef = doc(db, 'affiliates', user.uid)
        setDocumentNonBlocking(affiliateRef, affiliateData, { merge: true })

        // MENSAJE DE BIENVENIDA CON LINK DE DIVULGACIÓN
        const inviteLink = `${window.location.origin}/auth/register?role=buyer&ref=${user.uid}`
        const notificationsRef = collection(db, 'notifications')
        addDocumentNonBlocking(notificationsRef, {
          userId: user.uid,
          title: t.welcomeTitle,
          message: t.welcomeAffiliateMsg.replace('{link}', inviteLink),
          type: 'welcome',
          createdAt: new Date().toISOString(),
          isRead: false
        })
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

        // MENSAJE DE BIENVENIDA ESTÁNDAR
        const notificationsRef = collection(db, 'notifications')
        addDocumentNonBlocking(notificationsRef, {
          userId: user.uid,
          title: t.welcomeTitle,
          message: t.welcomeMsg,
          type: 'welcome',
          createdAt: new Date().toISOString(),
          isRead: false
        })
      }
      
      toast({
        title: t.language === 'es' ? "Registro exitoso" : "Registration successful",
        description: t.language === 'es' ? `¡Bienvenido a ${t.brand}! Revisa tu buzón de mensajes.` : `Welcome to ${t.brand}! Check your message box.`,
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
        {referralId && (
          <div className="mt-4 px-6 py-2 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Invitación Especial Activada</span>
          </div>
        )}
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-4">
          Únete a la nueva era del marketing digital
        </p>
      </div>

      {/* Role Selection - Hotmart Style */}
      {!referralId && (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <button 
            onClick={() => setRole('buyer')}
            className={cn(
              "relative group overflow-hidden p-8 rounded-[2.5rem] border-4 transition-all text-left shadow-2xl hover:shadow-primary/10",
              role === 'buyer' 
                ? "bg-white border-primary scale-[1.02] ring-8 ring-primary/5" 
                : "bg-white/50 border-white hover:border-slate-200 opacity-60 hover:opacity-100"
            )}
          >
            <div className={cn(
              "h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-colors",
              role === 'buyer' ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
            )}>
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="font-headline font-black text-2xl text-slate-900 leading-tight">
              {t.iWantToBuy}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Accede a los mejores productos y servicios digitales del mercado.
            </p>
            <div className={cn(
              "mt-6 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest",
              role === 'buyer' ? "text-primary" : "text-slate-400"
            )}>
              {t.joinAs} Comprador <ChevronRight className="h-3 w-3" />
            </div>
            {role === 'buyer' && <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 -skew-x-12 translate-x-12 -translate-y-8" />}
          </button>

          <button 
            onClick={() => setRole('affiliate')}
            className={cn(
              "relative group overflow-hidden p-8 rounded-[2.5rem] border-4 transition-all text-left shadow-2xl hover:shadow-primary/10",
              role === 'affiliate' 
                ? "bg-white border-primary scale-[1.02] ring-8 ring-primary/5" 
                : "bg-white/50 border-white hover:border-slate-200 opacity-60 hover:opacity-100"
            )}
          >
            <div className={cn(
              "h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-colors",
              role === 'affiliate' ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
            )}>
              <Target className="h-8 w-8" />
            </div>
            <h3 className="font-headline font-black text-2xl text-slate-900 leading-tight">
              {t.iWantToSell}
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Promociona productos ganadores y escala tus comisiones semanales.
            </p>
            <div className={cn(
              "mt-6 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest",
              role === 'affiliate' ? "text-primary" : "text-slate-400"
            )}>
              {t.joinAs} Afiliado <ChevronRight className="h-3 w-3" />
            </div>
            {role === 'affiliate' && <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 -skew-x-12 translate-x-12 -translate-y-8" />}
          </button>
        </div>
      )}

      {/* Registration Form */}
      <Card className="w-full max-w-2xl border-none shadow-2xl rounded-[3.5rem] overflow-hidden bg-white animate-in zoom-in-95 duration-500">
        <CardHeader className="pt-16 pb-8 px-10 text-center">
          <CardTitle className="text-3xl font-headline font-black text-slate-900">
            {role === 'affiliate' ? "Datos de Negocio" : "Datos de Acceso"}
          </CardTitle>
          <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-2">
            Completa tu perfil para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.firstName}</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Juan" 
                    required 
                    className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all pl-12 text-sm font-bold" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.lastName}</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Perez" 
                    required 
                    className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all pl-12 text-sm font-bold" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.email}</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="email" 
                    placeholder="juan.perez@email.com" 
                    required 
                    className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all pl-12 text-sm font-bold" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.password}</Label>
                <div className="relative group">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••" 
                    required 
                    className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold pr-12" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors"
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
                    <Input 
                      placeholder="1234567890" 
                      required 
                      className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold font-mono" 
                      value={formData.accNumber}
                      onChange={(e) => setFormData({...formData, accNumber: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.accountHolder}</Label>
                    <Input 
                      placeholder="Nombre completo según identificación" 
                      required 
                      className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold" 
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
              {loading ? "PROCESANDO..." : "EMPEZAR AHORA"}
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
          <Link href="/" className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
            <ArrowLeft className="h-3 w-3" /> Volver al Inicio
          </Link>
        </CardFooter>
      </Card>

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

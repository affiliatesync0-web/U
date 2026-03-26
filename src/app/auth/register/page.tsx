
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NICA_BANKS } from '@/lib/constants'
import { ArrowLeft, Eye, EyeOff, ShoppingBag, Target, User, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, setDocumentNonBlocking, useMemoFirebase, useDoc } from '@/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink, cn } from '@/lib/utils'

type UserRole = 'affiliate' | 'buyer'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const auth = useAuth()
  const db = useFirestore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<UserRole>('affiliate')
  
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
      } else {
        const buyerData = {
          id: user.uid,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          registeredAt: new Date().toISOString()
        }
        const buyerRef = doc(db, 'buyers', user.uid)
        setDocumentNonBlocking(buyerRef, buyerData, { merge: true })
      }
      
      toast({
        title: t.language === 'es' ? "Registro exitoso" : "Registration successful",
        description: t.language === 'es' ? `¡Bienvenido a ${t.brand}!` : `Welcome to ${t.brand}!`,
      })
      
      router.push(role === 'affiliate' ? '/dashboard/affiliate' : '/')
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
    <div className="min-h-screen bg-[#EFF2F4] flex flex-col justify-center items-center p-4 py-12 md:py-24">
      <Link href="/" className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity self-start md:self-center">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-black uppercase tracking-widest">{t.language === 'es' ? "Volver al Inicio" : "Back to Home"}</span>
      </Link>

      <div className="w-full max-w-3xl mb-10">
        <h2 className="text-center text-sm font-black text-slate-400 uppercase tracking-[0.3em] mb-6">{t.selectRole}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => setRole('buyer')}
            className={cn(
              "p-6 rounded-[2.5rem] border-4 transition-all flex items-center gap-4 text-left shadow-xl",
              role === 'buyer' ? "bg-primary border-primary text-white scale-105 shadow-primary/20" : "bg-white border-white text-slate-400 hover:border-slate-100"
            )}
          >
            <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shrink-0", role === 'buyer' ? "bg-white/20" : "bg-slate-50")}>
              <ShoppingBag className={cn("h-8 w-8", role === 'buyer' ? "text-white" : "text-slate-400")} />
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight uppercase tracking-tight">{t.iWantToBuy}</h3>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1", role === 'buyer' ? "text-white/60" : "text-slate-300")}>{t.joinAs} Comprador</p>
            </div>
          </button>

          <button 
            onClick={() => setRole('affiliate')}
            className={cn(
              "p-6 rounded-[2.5rem] border-4 transition-all flex items-center gap-4 text-left shadow-xl",
              role === 'affiliate' ? "bg-primary border-primary text-white scale-105 shadow-primary/20" : "bg-white border-white text-slate-400 hover:border-slate-100"
            )}
          >
            <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center shrink-0", role === 'affiliate' ? "bg-white/20" : "bg-slate-50")}>
              <Target className={cn("h-8 w-8", role === 'affiliate' ? "text-white" : "text-slate-400")} />
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight uppercase tracking-tight">{t.iWantToSell}</h3>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1", role === 'affiliate' ? "text-white/60" : "text-slate-300")}>{t.joinAs} Afiliado</p>
            </div>
          </button>
        </div>
      </div>

      <Card className="w-full max-w-2xl shadow-2xl border-none overflow-hidden rounded-[3rem] bg-white ring-1 ring-slate-100">
        <CardHeader className="text-center space-y-4 pt-12 pb-8 px-10">
          <div className="flex justify-center mb-2">
            <div className="relative h-20 w-20 overflow-hidden rounded-[1.5rem] shadow-2xl border-4 border-white flex items-center justify-center bg-slate-50 rotate-3 transition-transform hover:rotate-0">
              {displayLogoUrl ? (
                <Image 
                   src={displayLogoUrl} 
                   alt="Logo" 
                   fill 
                   className="object-contain p-2"
                   unoptimized
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground opacity-20" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl md:text-4xl font-headline font-black text-slate-900 tracking-tighter">
              {role === 'affiliate' ? t.affiliateRegister : t.buyerRegister}
            </CardTitle>
            <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest max-w-sm mx-auto">
              {role === 'affiliate' 
                ? "Únete a nuestra red y empieza a ganar comisiones hoy mismo." 
                : t.buyerSubtitle}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4 px-10">
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] px-1 border-l-4 border-primary ml-1">{t.personalInfo}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-1">{t.firstName}</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Juan" 
                    required 
                    className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-1">{t.lastName}</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Perez" 
                    required 
                    className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-1">{t.email}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="juan.perez@gmail.com" 
                    required 
                    className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-1">{t.password}</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••" 
                      required 
                      className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold pr-12" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {role === 'affiliate' && (
              <div className="pt-10 border-t border-slate-100 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] px-1 border-l-4 border-primary ml-1">{t.bankDetails}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bank" className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-1">{t.bankName}</Label>
                    <Select required onValueChange={(v) => setFormData({...formData, bank: v})}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200">
                        <SelectValue placeholder={t.language === 'es' ? "Selecciona un banco" : "Select a bank"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-2xl">
                        {NICA_BANKS.map((bank) => (
                          <SelectItem key={bank} value={bank}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accNumber" className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-1">{t.accountNumber}</Label>
                    <Input 
                      id="accNumber" 
                      placeholder="1234567890" 
                      required 
                      className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold" 
                      value={formData.accNumber}
                      onChange={(e) => setFormData({...formData, accNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="accHolder" className="font-black text-[10px] uppercase tracking-widest text-slate-500 px-1">{t.accountHolder}</Label>
                    <Input 
                      id="accHolder" 
                      placeholder="Juan Alberto Perez Lopez" 
                      required 
                      className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-sm font-bold" 
                      value={formData.accHolder}
                      onChange={(e) => setFormData({...formData, accHolder: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 font-black text-xl h-20 shadow-2xl shadow-primary/30 transition-all rounded-[1.5rem] mb-4 hover:scale-[1.02] active:scale-95" 
              disabled={loading}
            >
              {loading ? (t.language === 'es' ? "CREANDO CUENTA..." : "CREATING ACCOUNT...") : t.createAccount.toUpperCase()}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-slate-50 py-10 bg-slate-50/50">
          <p className="text-sm text-slate-400 font-bold">
            {t.language === 'es' ? "¿Ya tienes cuenta?" : "Already have an account?"} <Link href="/auth/login" className="text-primary font-black ml-1 uppercase tracking-widest text-[11px] hover:underline">{t.login}</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

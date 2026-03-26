
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NICA_BANKS } from '@/lib/constants'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const auth = useAuth()
  const db = useFirestore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    bank: '',
    accNumber: '',
    accHolder: ''
  })

  const logoImage = placeholderData.placeholderImages.find(img => img.id === 'site-logo');

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
      
      toast({
        title: t.language === 'es' ? "Registro exitoso" : "Registration successful",
        description: t.language === 'es' ? `¡Bienvenido a ${t.brand}!` : `Welcome to ${t.brand}!`,
      })
      router.push('/dashboard/affiliate')
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
      <Link href="/" className="mb-6 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity self-start md:self-center">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">{t.language === 'es' ? "Volver al Inicio" : "Back to Home"}</span>
      </Link>

      <Card className="w-full max-w-2xl shadow-xl border-none overflow-hidden rounded-[2rem]">
        <CardHeader className="text-center space-y-1 bg-white border-b pb-8">
          <div className="flex justify-center mb-4 pt-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl shadow-lg border">
              <Image 
                 src={logoImage?.imageUrl || ""} 
                 alt="Logo" 
                 fill 
                 className="object-contain p-2"
              />
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-headline font-bold text-[#2870A3]">{t.joinAffiliate}</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            {t.language === 'es' ? "Únete a nuestra red y empieza a ganar comisiones hoy mismo." : "Join our network and start earning commissions today."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 px-6 md:px-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t.personalInfo}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t.firstName}</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Juan" 
                    required 
                    className="h-11 rounded-xl" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t.lastName}</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Perez" 
                    required 
                    className="h-11 rounded-xl" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="juan.perez@gmail.com" 
                    required 
                    className="h-11 rounded-xl" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t.password}</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••" 
                      required 
                      className="h-11 pr-10 rounded-xl" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">{t.bankDetails}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank">{t.bankName}</Label>
                  <Select required onValueChange={(v) => setFormData({...formData, bank: v})}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder={t.language === 'es' ? "Selecciona un banco" : "Select a bank"} />
                    </SelectTrigger>
                    <SelectContent>
                      {NICA_BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accNumber">{t.accountNumber}</Label>
                  <Input 
                    id="accNumber" 
                    placeholder="1234567890" 
                    required 
                    className="h-11 rounded-xl" 
                    value={formData.accNumber}
                    onChange={(e) => setFormData({...formData, accNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="accHolder">{t.accountHolder}</Label>
                  <Input 
                    id="accHolder" 
                    placeholder="Juan Alberto Perez Lopez" 
                    required 
                    className="h-11 rounded-xl" 
                    value={formData.accHolder}
                    onChange={(e) => setFormData({...formData, accHolder: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold text-lg h-14 shadow-lg transition-all rounded-xl mb-4" disabled={loading}>
              {loading ? (t.language === 'es' ? "Creando Cuenta..." : "Creating Account...") : t.createAccount}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t py-6 bg-muted/30">
          <p className="text-sm text-muted-foreground font-medium">
            {t.language === 'es' ? "¿Ya tienes cuenta?" : "Already have an account?"} <Link href="/auth/login" className="text-primary font-bold hover:underline">{t.login}</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

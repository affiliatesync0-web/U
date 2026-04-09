
"use client"

import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Mail, Lock, ShoppingBag, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { sendEmail } from '@/lib/email'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function BuyerRegisterContent() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  })

  const logoConfigRef = useMemoFirebase(() => doc(db, 'site_config', 'site-logo'), [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorDetail(null);

    const cleanEmail = formData.email.toLowerCase().trim();
    const cleanPass = formData.password.trim();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
      const user = userCredential.user;

      await setDoc(doc(db, 'buyers', user.uid), {
        id: user.uid,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: cleanEmail,
        whatsappNumber: formData.phone.replace(/\D/g, ''),
        registeredAt: new Date().toISOString(),
        status: 'Active'
      });

      sendEmail({
        to: 'affiliatesync0@gmail.com',
        subject: `🆕 Nuevo Registro: COMPRADOR`,
        text: `Un nuevo cliente se ha registrado.\n\nNombre: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}`
      }).catch(() => {});

      toast({ title: "¡Bienvenido!", description: "Tu cuenta de comprador ha sido creada con éxito." });
      router.push('/dashboard/buyer');

    } catch (err: any) {
      console.error("Buyer Register Error:", err);
      let msg = "No pudimos crear tu cuenta.";
      if (err.code === 'auth/email-already-in-use') msg = "Este correo ya existe.";
      else if (err.code === 'auth/weak-password') msg = "Contraseña muy débil.";
      
      setErrorDetail(err.code || "Error de conexión");
      toast({ variant: "destructive", title: "Error", description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-4">
      <div className="fixed top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <Link href="/auth/register" className="mb-10 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Volver a selección</span>
      </Link>

      <Card className="w-full max-w-2xl border-none shadow-2xl rounded-[3.5rem] p-10 md:p-14 bg-card animate-in slide-in-from-bottom-4">
        <div className="space-y-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-headline font-black uppercase italic">Registro de <span className="text-primary">Comprador</span></h2>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-2">Accede a formación premium certificada</p>
            </div>
          </div>

          {errorDetail && (
            <Alert variant="destructive" className="rounded-2xl bg-red-50 border-red-100">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-bold">{errorDetail}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre</Label>
                <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required className="h-14 rounded-2xl font-bold" placeholder="Juan" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Apellido</Label>
                <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required className="h-14 rounded-2xl font-bold" placeholder="Pérez" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">WhatsApp</Label>
              <Input placeholder="50588888888" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="h-14 rounded-2xl font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="h-14 rounded-2xl font-bold" placeholder="correo@ejemplo.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Contraseña</Label>
              <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="h-14 rounded-2xl font-bold" placeholder="Mínimo 6 caracteres" />
            </div>
            <Button type="submit" className="w-full h-18 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "CREAR MI CUENTA DE CLIENTE"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}

export default function BuyerRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <BuyerRegisterContent />
    </Suspense>
  )
}

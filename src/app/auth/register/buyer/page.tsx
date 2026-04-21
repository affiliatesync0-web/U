"use client"

import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Triangle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useAuth, useFirestore, useMemoFirebase, useDoc } from '@/firebase'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import placeholderData from '@/app/lib/placeholder-images.json'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { sendEmail } from '@/lib/email'
import { COUNTRY_CODES } from '@/lib/constants'

function BuyerRegisterContent() {
  const { toast } = useToast()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+505',
    phone: '',
    password: ''
  })

  const logoConfigRef = useMemoFirebase(() => db ? doc(db, 'site_config', 'site-logo') : null, [db]);
  const { data: logoOverride } = useDoc(logoConfigRef);
  const defaultLogo = placeholderData.placeholderImages.find(img => img.id === 'site-logo');
  const displayLogoUrl = getGoogleDriveDirectLink(logoOverride?.imageUrl || defaultLogo?.imageUrl || "");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setLoading(true);
    setErrorMsg(null);

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
        whatsappNumber: (formData.countryCode + formData.phone).replace(/\D/g, ''),
        registeredAt: new Date().toISOString(),
        status: 'Active'
      });

      sendEmail({
        to: 'affiliatesync0@gmail.com',
        subject: `🆕 Nuevo Registro: COMPRADOR`,
        text: `Un nuevo cliente se ha registrado.\n\nNombre: ${formData.firstName} ${formData.lastName}\nEmail: ${formData.email}`
      }).catch(() => {});

      await signOut(auth);
      toast({ title: "¡Cuenta Creada!", description: "Ahora inicia sesión con tus datos." });
      router.push('/auth/login');

    } catch (err: any) {
      console.error("Buyer Register Error:", err);
      let msg = "No pudimos crear tu cuenta.";
      if (err.code === 'auth/email-already-in-use') msg = "Este correo ya existe.";
      else if (err.code === 'auth/weak-password') msg = "La contraseña debe tener al menos 6 caracteres.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white md:bg-[#EAEDED] flex flex-col items-center pt-8 pb-12 px-4">
      
      {/* LOGO */}
      <div className="mb-4">
        <Link href="/">
          <div className="relative h-12 w-32 md:h-14 md:w-36">
            {displayLogoUrl ? (
              <Image src={displayLogoUrl} alt="Logo" fill className="object-contain" unoptimized />
            ) : (
              <span className="text-[#111] font-black text-2xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
            )}
          </div>
        </Link>
      </div>

      <Card className="w-full max-w-[350px] border border-[#ddd] shadow-none md:shadow-sm rounded-[4px] bg-white p-6 md:p-8">
        <h1 className="text-[28px] font-normal text-[#111] mb-5 leading-tight text-left">Crear cuenta</h1>

        {errorMsg && (
          <div className="mb-4 p-3 bg-white border border-[#c40000] rounded-[4px] flex gap-3 items-start animate-in fade-in">
            <Triangle className="h-4 w-4 text-[#c40000] fill-[#c40000] mt-1 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-[13px] font-bold text-[#c40000]">Hubo un problema</h4>
              <p className="text-[12px] text-[#111]">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-[13px] font-bold text-[#111]">Tu nombre</Label>
            <Input 
              value={formData.firstName} 
              onChange={e => setFormData({...formData, firstName: e.target.value})} 
              required 
              placeholder="Nombre"
              className="h-8 border-[#888c8c] focus:border-[#e77600] focus:ring-[3px] focus:ring-[#e77600]/20 rounded-[3px] px-2 py-1 text-[13px] font-medium" 
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[13px] font-bold text-[#111]">Apellido</Label>
            <Input 
              value={formData.lastName} 
              onChange={e => setFormData({...formData, lastName: e.target.value})} 
              required 
              placeholder="Apellido"
              className="h-8 border-[#888c8c] focus:border-[#e77600] focus:ring-[3px] focus:ring-[#e77600]/20 rounded-[3px] px-2 py-1 text-[13px] font-medium" 
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[13px] font-bold text-[#111]">Número de móvil</Label>
            <div className="flex gap-0 items-stretch">
              <Select value={formData.countryCode} onValueChange={(v) => setFormData({...formData, countryCode: v})}>
                <SelectTrigger className="w-[100px] h-8 border-[#888c8c] focus:border-[#e77600] focus:ring-[3px] focus:ring-[#e77600]/20 rounded-[3px] rounded-r-none px-2 bg-white text-[13px] font-bold flex shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_CODES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input 
                placeholder="Número de móvil" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                required 
                className="flex-1 h-8 border-[#888c8c] focus:border-[#e77600] focus:ring-[3px] focus:ring-[#e77600]/20 rounded-[3px] rounded-l-none px-2 py-1 text-[13px] font-medium" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[13px] font-bold text-[#111]">Dirección de e-mail</Label>
            <Input 
              type="email" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              required 
              className="h-8 border-[#888c8c] focus:border-[#e77600] focus:ring-[3px] focus:ring-[#e77600]/20 rounded-[3px] px-2 py-1 text-[13px] font-medium" 
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[13px] font-bold text-[#111]">Contraseña</Label>
            <Input 
              type="password" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
              placeholder="Al menos 6 caracteres"
              className="h-8 border-[#888c8c] focus:border-[#e77600] focus:ring-[3px] focus:ring-[#e77600]/20 rounded-[3px] px-2 py-1 text-[13px] font-medium" 
            />
            <div className="flex gap-1.5 items-center pt-1">
              <div className="h-3.5 w-3.5 flex items-center justify-center border border-[#0066c0] rounded-sm bg-white shrink-0">
                <span className="text-[#0066c0] text-[10px] font-bold">i</span>
              </div>
              <p className="text-[12px] text-[#111]">Las contraseñas deben tener al menos 6 caracteres.</p>
            </div>
          </div>

          <Button 
            type="submit"
            className="amazon-btn-primary w-full h-8 mt-4" 
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crea tu cuenta de Sync"}
          </Button>

          <p className="text-[12px] text-[#111] leading-snug pt-2">
            Al crear una cuenta, aceptas las <Link href="#" className="text-[#0066c0] hover:underline hover:text-[#c45500]">Condiciones de uso</Link> y el <Link href="#" className="text-[#0066c0] hover:underline hover:text-[#c45500]">Aviso de privacidad</Link> de Sync Connect.
          </p>
        </form>

        <div className="mt-6 pt-6 border-t border-[#eee] text-center">
           <p className="text-[13px] text-[#111]">
            ¿Ya tienes una cuenta? <Link href="/auth/login" className="text-[#0066c0] hover:underline hover:text-[#c45500] font-medium">Iniciar sesión <ChevronRight className="inline h-3 w-3" /></Link>
          </p>
        </div>
      </Card>

      {/* FOOTER */}
      <footer className="mt-12 w-full max-w-xl text-center space-y-4 border-t border-[#eee] pt-8 bg-gradient-to-b from-[#eee] to-transparent bg-[length:100%_1px] bg-no-repeat">
        <div className="flex justify-center gap-8">
          <Link href="#" className="text-[11px] text-[#0066c0] hover:text-[#c45500] hover:underline">Condiciones de uso</Link>
          <Link href="#" className="text-[11px] text-[#0066c0] hover:text-[#c45500] hover:underline">Aviso de privacidad</Link>
          <Link href="#" className="text-[11px] text-[#0066c0] hover:text-[#c45500] hover:underline">Ayuda</Link>
        </div>
        <p className="text-[11px] text-[#555]">© 2024, SyncConnect.com, Inc. o sus afiliados</p>
      </footer>
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

"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Loader2, ShieldCheck, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { adminGenerateResetLink } from '@/lib/auth-actions'
import { sendPasswordResetEmailCustom } from '@/lib/email'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const auth = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
        toast({ variant: "destructive", title: "Correo requerido" });
        return;
    }

    setLoading(true);
    try {
      // 1. Intentar generar enlace premium mediante Admin SDK
      const result = await adminGenerateResetLink(cleanEmail);
      
      if (!result.success) {
        // FALLBACK: Si no hay permisos administrativos o claves configuradas, usamos el método estándar
        console.warn("Usando fallback de recuperación estándar:", result.error);
        await sendPasswordResetEmail(auth, cleanEmail);
        toast({ title: "🔑 Enlace Enviado", description: "Revisa tu Gmail. Hemos enviado las instrucciones de acceso." });
        setSuccess(true);
        return;
      }

      // 2. Enviar el correo con código premium si el paso 1 fue exitoso
      const resetOrigin = window.location.origin;
      const emailRes = await sendPasswordResetEmailCustom({
        to: cleanEmail,
        oobCode: result.oobCode as string,
        origin: resetOrigin
      });

      if (emailRes.success) {
        toast({ title: "🛡️ Código Enviado", description: "Revisa tu Gmail. Ingresa el código recibido para continuar." });
        setSuccess(true);
        // Redirigir automáticamente a la página de ingreso de código después de un momento
        setTimeout(() => router.push('/auth/reset-password'), 3000);
      } else {
        await sendPasswordResetEmail(auth, cleanEmail);
        toast({ title: "🔑 Enlace Enviado", description: "Se ha enviado un enlace de recuperación estándar." });
        setSuccess(true);
      }
    } catch (error: any) {
      console.error("Forgot Password Error:", error);
      toast({ variant: "destructive", title: "Error de Conexión", description: "Asegúrate de estar conectado a internet e intenta de nuevo." });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-none rounded-[4rem] overflow-hidden bg-white p-2">
          <div className="bg-slate-50/50 rounded-[3.5rem] p-10 md:p-14 text-center space-y-8">
            <div className="h-24 w-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-bounce">
              <MailCheck className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 uppercase italic">¡Revisa tu Gmail!</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Hemos enviado un <b>Código de Seguridad</b> a tu correo. Por favor, ingrésalo en la siguiente pantalla para restablecer tu acceso.
              </p>
            </div>
            <Button asChild className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black uppercase text-xs tracking-widest shadow-xl">
              <Link href="/auth/reset-password">CONTINUAR AL INGRESO DE CÓDIGO</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white md:bg-[#EAEDED] flex flex-col items-center pt-8 pb-12 px-4">
      <Link href="/auth/login" className="mb-6 flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold uppercase text-[10px] tracking-widest group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Volver al login</span>
      </Link>

      <Card className="w-full max-w-[350px] border border-[#ddd] shadow-none md:shadow-sm rounded-[4px] bg-white p-6 md:p-8">
        <h1 className="text-[28px] font-normal text-[#111] mb-5 leading-tight">Asistencia</h1>
        
        <CardContent className="p-0 space-y-4">
          <p className="text-[13px] text-[#111] leading-relaxed">
            Escribe el correo electrónico asociado a tu cuenta de Sync. Recibirás un <b>Código de Seguridad</b> premium para cambiar tu clave.
          </p>

          <form onSubmit={handleResetRequest} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[13px] font-bold text-[#111]">Dirección de e-mail</Label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="amazon-input h-8" 
              />
            </div>
            <Button type="submit" className="amazon-btn-primary w-full h-8 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <footer className="mt-auto pt-10 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
        Seguridad de Acceso • Sync Connect Nicaragua
      </footer>
    </div>
  )
}

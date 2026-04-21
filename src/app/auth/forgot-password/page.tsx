"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Lock, Mail, Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import { adminGenerateResetLink } from '@/lib/auth-actions'
import { sendPasswordResetEmailCustom } from '@/lib/email'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
        toast({ variant: "destructive", title: "Correo requerido" });
        return;
    }

    setLoading(true);
    try {
      // 1. Generar enlace seguro
      const result = await adminGenerateResetLink(cleanEmail);
      
      if (!result.success) {
        if (result.error === 'USUARIO_NO_EXISTE') {
          toast({ variant: "destructive", title: "Cuenta no encontrada" });
        } else {
          throw new Error(result.error);
        }
        return;
      }

      // 2. Enviar el correo con origen dinámico para que funcione en localhost y producción
      const resetOrigin = window.location.origin;
      const emailRes = await sendPasswordResetEmailCustom({
        to: cleanEmail,
        oobCode: result.oobCode as string,
        origin: resetOrigin
      });

      if (emailRes.success) {
        toast({ title: "🔑 Enlace Enviado", description: "Revisa tu Gmail. El botón te llevará al cambio de clave." });
        setEmail('');
      } else {
        throw new Error(emailRes.error);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Fallo en el servidor", description: "No pudimos enviar el correo." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white md:bg-[#EAEDED] flex flex-col items-center pt-8 pb-12">
      <Link href="/auth/login" className="mb-6 flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold uppercase text-[10px] tracking-widest">
        <ArrowLeft className="h-4 w-4" />
        <span>Volver al login</span>
      </Link>

      <Card className="w-full max-w-[350px] border border-[#ddd] shadow-none md:shadow-sm rounded-[4px] bg-white p-6 md:p-8">
        <h1 className="text-[28px] font-normal text-[#111] mb-5 leading-tight">Asistencia</h1>
        
        <CardContent className="p-0 space-y-4">
          <p className="text-[13px] text-[#111] leading-relaxed">
            Escribe el correo electrónico asociado a tu cuenta de Sync. Recibirás un enlace premium para cambiar tu clave.
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
            <Button type="submit" className="amazon-btn-primary w-full h-8" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

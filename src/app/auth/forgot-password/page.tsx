"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Loader2, Mail, ShieldCheck, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { sendPasswordResetCode } from '@/lib/email'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [errorDetail, setErrorDetail] = useState<string | null>(null)

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorDetail(null);
    
    try {
      const result = await sendPasswordResetCode(email.trim().toLowerCase());
      if (result.success) {
        toast({ title: "Código Enviado", description: "Revisa tu Gmail (incluyendo SPAM)." });
        router.push(`/auth/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      } else {
        setErrorDetail(result.error || "No se pudo conectar con el servidor SMTP.");
        toast({ variant: "destructive", title: "Fallo en Envío", description: "Revisa el aviso en pantalla." });
        setLoading(false);
      }
    } catch (error: any) {
      setErrorDetail("Ocurrió un error inesperado al procesar la solicitud.");
      toast({ variant: "destructive", title: "Error crítico", description: "Fallo de conexión interno." });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Link href="/auth/login" className="mb-10 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold uppercase text-[10px] tracking-widest group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Volver al login</span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-white p-2">
        <div className="bg-slate-50/50 rounded-[3rem] p-10 md:p-14 text-center">
          <CardHeader className="p-0 mb-12 space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-[2.2rem] bg-primary flex items-center justify-center text-white shadow-2xl rotate-3">
                <ShieldCheck className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-headline font-black text-slate-900 tracking-tight">Recuperar Clave</CardTitle>
              <p className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mt-2">Enviaremos un código a tu correo</p>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-6">
            {errorDetail && (
              <Alert variant="destructive" className="bg-red-50 border-red-100 rounded-2xl text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Error de Conexión</AlertTitle>
                <AlertDescription className="text-xs font-medium leading-relaxed">
                  {errorDetail}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSendCode} className="space-y-6 text-left">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Tu Email Registrado</Label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="h-14 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all font-bold px-6" 
                  placeholder="ejemplo@correo.com" 
                />
              </div>
              <Button 
                type="submit"
                className="w-full h-18 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95" 
                disabled={loading}
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "ENVIAR CÓDIGO DE SEGURIDAD"}
              </Button>
            </form>
            
            <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-relaxed">
                El código será enviado desde tu Gmail configurado en el panel administrativo.
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

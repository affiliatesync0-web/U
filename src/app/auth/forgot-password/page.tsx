"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const auth = useAuth()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setSubmitted(true);
      toast({ title: "Email Enviado", description: "Revisa tu bandeja de entrada para restablecer tu contraseña." });
    } catch (error: any) {
      console.error("Reset Error:", error);
      toast({ variant: "destructive", title: "Error", description: "No pudimos procesar tu solicitud. Verifica el correo." });
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
          {!submitted ? (
            <>
              <CardHeader className="p-0 mb-12 space-y-4">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-[2.2rem] bg-primary flex items-center justify-center text-white shadow-2xl rotate-3">
                    <Mail className="h-10 w-10" />
                  </div>
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-headline font-black text-slate-900 tracking-tight">Recuperar Clave</CardTitle>
                  <p className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mt-2">Enviaremos un link a tu correo</p>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <form onSubmit={handleReset} className="space-y-6 text-left">
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
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "ENVIAR INSTRUCCIONES"}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-[2.5rem] bg-green-500 flex items-center justify-center text-white shadow-2xl -rotate-3">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-slate-900 leading-tight">¡Correo Enviado!</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  Hemos enviado las instrucciones para cambiar tu contraseña a <strong>{email}</strong>. Revisa también tu carpeta de SPAM.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-slate-200">
                <Link href="/auth/login">VOLVER AL INICIO DE SESIÓN</Link>
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

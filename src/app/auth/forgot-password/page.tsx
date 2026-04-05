"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Lock, Mail, Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { useAuth } from '@/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
        toast({
            variant: "destructive",
            title: "Correo requerido",
            description: "Por favor, ingresa tu correo electrónico."
        });
        return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      toast({
        title: "Correo Enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña. El correo puede tardar unos minutos."
      });
      setEmail('');
    } catch (error: any) {
      let description = "No se pudo enviar el correo. Verifica tu conexión e intenta de nuevo.";
      if (error.code === 'auth/user-not-found') {
        description = "No se encontró ninguna cuenta registrada con este correo electrónico."
      } else if (error.code === 'auth/invalid-email') {
        description = "El formato del correo electrónico no es válido."
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: description,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 transition-colors duration-300">
      <div className="fixed top-6 right-6 flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <Link href="/auth/login" className="mb-10 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-black uppercase text-[10px] tracking-widest group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Volver al login</span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-card p-2 ring-1 ring-border/50">
        <div className="bg-muted/30 rounded-[3rem] p-10 md:p-14 text-center">
          <CardHeader className="p-0 mb-12 space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-[2.2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner rotate-3">
                <Lock className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-headline font-black text-foreground tracking-tight">Recuperar Acceso</CardTitle>
              <p className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Seguridad Sync Connect</p>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-8 text-left">
            <form onSubmit={handleResetRequest} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Tu Email Registrado</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="h-14 rounded-2xl bg-card border-none ring-1 ring-border focus:ring-4 focus:ring-primary/10 transition-all font-bold pl-12 pr-6" 
                    placeholder="ejemplo@correo.com" 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                  <><Send className="mr-2 h-4 w-4" /> ENVIAR LINK DE RECUPERACIÓN</>
                )}
              </Button>
            </form>
            <p className="text-sm text-center text-muted-foreground">Se enviará un enlace seguro a tu correo electrónico para que puedas establecer una nueva contraseña.</p>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}
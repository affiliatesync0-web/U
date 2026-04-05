
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, ShieldAlert, MessageCircle, Lock, Mail, Loader2, Send } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-context'
import { useAuth } from '@/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRestricted, setIsRestricted] = useState(false)

  const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail !== ADMIN_EMAIL) {
      setIsRestricted(true);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      toast({
        title: "Correo Enviado",
        description: "Revisa tu bandeja de entrada de Gmail para restablecer tu clave maestra."
      });
      setEmail('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No pudimos enviar el correo. Verifica tu conexión."
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
              <CardTitle className="text-3xl font-headline font-black text-foreground tracking-tight">Recuperación</CardTitle>
              <p className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Seguridad Sync Connect</p>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-8 text-left">
            {!isRestricted ? (
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
                    <><Send className="mr-2 h-4 w-4" /> SOLICITAR ACCESO</>
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 text-center">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase">
                    Acceso Restringido: Solo el administrador puede restablecer su contraseña de forma autónoma.
                  </p>
                </div>
                <div className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground text-center">
                    Si eres un afiliado o comprador y has olvidado tu clave, contacta directamente con el soporte para un reseteo manual.
                  </p>
                  <Button asChild className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                    <Link href="/auth/login">
                      <MessageCircle className="mr-2 h-5 w-5" /> CONTACTAR SOPORTE
                    </Link>
                  </Button>
                  <Button variant="ghost" onClick={() => setIsRestricted(false)} className="w-full text-[9px] font-black uppercase tracking-widest">
                    Intentar con otro correo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

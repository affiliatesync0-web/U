
"use client"

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, ShieldAlert, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'

export default function ForgotPasswordPage() {
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
                <ShieldAlert className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-headline font-black text-foreground tracking-tight">Acceso Restringido</CardTitle>
              <p className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Seguridad Sync Connect</p>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-8">
            <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase">
                Por políticas de seguridad de la red, los usuarios no pueden restablecer su contraseña de forma autónoma.
              </p>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Si has olvidado tu contraseña, por favor contacta directamente con el soporte administrativo para recibir nuevas credenciales.
              </p>
              
              <Button asChild className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                <Link href="/auth/login">
                  <MessageCircle className="mr-2 h-5 w-5" /> CONTACTAR SOPORTE
                </Link>
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

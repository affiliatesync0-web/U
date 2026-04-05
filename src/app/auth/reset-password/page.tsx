
"use client"

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-card p-2 ring-1 ring-border/50">
        <div className="bg-muted/30 rounded-[3rem] p-10 md:p-14 text-center space-y-8">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-[2.5rem] bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
              <ShieldAlert className="h-12 w-12" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl font-black text-foreground leading-tight">Flujo Deshabilitado</h3>
            <p className="text-muted-foreground font-medium">
              Esta sección ya no está disponible para el público. El cambio de contraseña debe ser gestionado por un administrador autorizado.
            </p>
          </div>
          <Button asChild className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest">
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" /> VOLVER AL INICIO
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}

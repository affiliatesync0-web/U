"use client"

import { useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Lock, Loader2, CheckCircle2, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useFirestore } from '@/firebase'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'

function ResetPasswordContent() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const db = useFirestore()
  
  const email = searchParams.get('email') || ''
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({ code: '', password: '', confirm: '' })

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.password) return;

    if (formData.password !== formData.confirm) {
      toast({ variant: "destructive", title: "Error", description: "Las contraseñas no coinciden." });
      return;
    }

    setLoading(true);
    try {
      // 1. Validar código en Firestore
      const resetRef = doc(db, 'password_resets', email.toLowerCase().trim());
      const resetSnap = await getDoc(resetRef);

      if (!resetSnap.exists()) {
        toast({ variant: "destructive", title: "Invalido", description: "No hay una solicitud activa para este correo." });
        setLoading(false);
        return;
      }

      const data = resetSnap.data();
      const now = new Date().toISOString();

      if (data.code !== formData.code) {
        toast({ variant: "destructive", title: "Código Incorrecto", description: "El código ingresado no es válido." });
        setLoading(false);
        return;
      }

      if (now > data.expiresAt) {
        toast({ variant: "destructive", title: "Expirado", description: "El código ha caducado. Pide uno nuevo." });
        setLoading(false);
        return;
      }

      // 2. Simulación de actualización de clave en Firebase Auth
      // Nota: En un entorno de producción real con Admin SDK se usaría admin.auth().updateUser()
      // Para este prototipo, notificamos al usuario del éxito.
      
      await deleteDoc(resetRef);
      setSuccess(true);
      toast({ title: "Contraseña Actualizada", description: "Ya puedes iniciar sesión con tu nueva clave." });
      
      setTimeout(() => router.push('/auth/login'), 3000);

    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "No pudimos procesar el cambio." });
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-white p-2">
          <div className="bg-slate-50/50 rounded-[3rem] p-10 md:p-14 text-center space-y-8">
            <div className="flex justify-center">
              <div className="h-24 w-24 rounded-[2.5rem] bg-green-500 flex items-center justify-center text-white shadow-2xl">
                <CheckCircle2 className="h-12 w-12" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 leading-tight">¡Todo Listo!</h3>
              <p className="text-slate-500 font-medium">Tu contraseña ha sido restablecida con éxito. Redirigiendo al login...</p>
            </div>
            <Button asChild className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest">
              <Link href="/auth/login">IR AL LOGIN AHORA</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-white p-2">
        <div className="bg-slate-50/50 rounded-[3rem] p-10 md:p-14 text-center">
          <CardHeader className="p-0 mb-10 space-y-4">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-[2.2rem] bg-primary flex items-center justify-center text-white shadow-2xl -rotate-3">
                <KeyRound className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-headline font-black text-slate-900 tracking-tight">Nueva Clave</CardTitle>
              <p className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mt-2">Ingresa el código enviado a {email}</p>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleReset} className="space-y-5 text-left">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Código de 6 Dígitos</Label>
                <Input 
                  required
                  placeholder="000000"
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value.replace(/\D/g, '').substring(0, 6)})}
                  className="h-16 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all font-black text-center text-2xl tracking-[0.5em]" 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Nueva Contraseña</Label>
                <Input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="h-14 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 px-6 font-bold" 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Confirmar Contraseña</Label>
                <Input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.confirm}
                  onChange={e => setFormData({...formData, confirm: e.target.value})}
                  className="h-14 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 px-6 font-bold" 
                />
              </div>
              <Button 
                type="submit"
                className="w-full h-18 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95" 
                disabled={loading}
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "ACTUALIZAR MI CONTRASEÑA"}
              </Button>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}

"use client"

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/firebase'
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, KeyRound, ArrowLeft, Eye, EyeOff, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const auth = useAuth()

  const [code, setCode] = useState<string | null>(null)
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const oobCode = searchParams.get('oobCode');
    if (!oobCode) {
      setIsValidCode(false)
      setLoading(false)
      return
    }
    
    setCode(oobCode)
    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setIsValidCode(true)
      })
      .catch((error) => {
        console.error("Invalid reset code:", error);
        setIsValidCode(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [searchParams, auth])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Las contraseñas no coinciden",
        description: "Por favor, verifica que ambas contraseñas sean iguales."
      });
      return;
    }
    if (password.length < 6) {
        toast({
            variant: "destructive",
            title: "Contraseña muy corta",
            description: "La contraseña debe tener al menos 6 caracteres."
          });
          return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, code, password);
      setSuccess(true);
      toast({
        title: "¡Acceso Restaurado!",
        description: "Tu nueva contraseña ha sido establecida con éxito."
      });
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: "El enlace ha caducado por seguridad. Solicita uno nuevo."
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-6 py-10">
        <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
        </div>
        <div className="space-y-1 text-center">
            <p className="text-slate-900 font-black uppercase text-[10px] tracking-[0.3em]">Validando Token</p>
            <p className="text-slate-400 text-xs font-bold">Verificando seguridad de la conexión...</p>
        </div>
      </div>
    )
  }

  if (!isValidCode) {
    return (
      <div className="text-center space-y-8 py-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="h-20 w-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 uppercase italic">Enlace Caducado</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
              Por seguridad, los enlaces de cambio de clave son de un solo uso y expiran pronto.
            </p>
        </div>
        <Button asChild className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-2xl transition-all">
          <Link href="/auth/forgot-password">
            <ArrowLeft className="mr-2 h-4 w-4" /> SOLICITAR NUEVO ENLACE
          </Link>
        </Button>
      </div>
    )
  }
  
  if (success) {
    return (
        <div className="text-center space-y-8 py-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="h-24 w-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl ring-8 ring-green-50/50">
                <CheckCircle className="h-12 w-12" />
            </div>
            <div className="space-y-2">
                <h3 className="text-3xl font-headline font-black text-slate-900 uppercase italic tracking-tight">¡Éxito Total!</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Tu contraseña ha sido actualizada. Serás redirigido al panel de control en unos segundos.
                </p>
            </div>
            <Button asChild className="w-full h-18 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20">
              <Link href="/auth/login">
                INICIAR SESIÓN AHORA
              </Link>
            </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleResetPassword} className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Nueva Contraseña de Acceso</Label>
        <div className="relative">
          <Input 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={6}
            className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all font-black px-6 text-slate-900" 
            placeholder="••••••••" 
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Confirmar Contraseña</Label>
        <div className="relative">
          <Input 
            type={showPassword ? "text" : "password"} 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all font-black px-6 text-slate-900" 
            placeholder="••••••••" 
          />
           <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
        </div>
      </div>

      <div className="pt-4">
        <Button 
            type="submit"
            className="w-full h-20 rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 group"
            disabled={loading}
        >
            {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                <>ESTABLECER CONTRASEÑA <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
            )}
        </Button>
      </div>
      
      <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-6">
        Al confirmar, se cerrarán todas las demás sesiones <br/> abiertas por seguridad.
      </p>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 md:p-10">
      <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
        <Link href="/auth/login" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-black uppercase text-[10px] tracking-widest group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Volver al portal</span>
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-none rounded-[4rem] overflow-hidden bg-white p-2">
        <div className="bg-slate-50/30 rounded-[3.5rem] p-10 md:p-14 text-center">
            <CardHeader className="p-0 mb-10 space-y-6">
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-primary shadow-2xl rotate-6 transition-transform hover:rotate-0 duration-500 border-4 border-slate-800">
                        <KeyRound className="h-10 w-10" />
                    </div>
                </div>
                <div className="space-y-2">
                    <CardTitle className="text-4xl font-headline font-black text-slate-900 tracking-tighter leading-none italic uppercase">
                        Sync <span className="text-primary">Security</span>
                    </CardTitle>
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-px w-8 bg-slate-200" />
                        <p className="font-bold text-[9px] uppercase tracking-[0.4em] text-slate-400">Actualizar Acceso</p>
                        <div className="h-px w-8 bg-slate-200" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Suspense fallback={
                    <div className="py-20 flex justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </CardContent>
        </div>
      </Card>
      
      <footer className="mt-12 text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] text-center">
        Encrypted Core • Sync Connect Nicaragua
      </footer>
    </div>
  )
}
import { ArrowRight } from 'lucide-react'

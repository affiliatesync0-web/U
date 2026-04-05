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
import { Loader2, KeyRound, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react'
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
        title: "¡Contraseña Actualizada!",
        description: "Ya puedes iniciar sesión con tu nueva contraseña."
      });
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: "No se pudo cambiar la contraseña. El enlace puede haber expirado."
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold">Verificando enlace...</p>
      </div>
    )
  }

  if (!isValidCode) {
    return (
      <div className="text-center space-y-6">
        <h3 className="text-2xl font-black text-destructive">Enlace Inválido o Expirado</h3>
        <p className="text-muted-foreground">
          El enlace para restablecer la contraseña no es válido. Puede que ya lo hayas usado o que haya expirado.
        </p>
        <Button asChild className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest">
          <Link href="/auth/forgot-password">
            <ArrowLeft className="mr-2 h-4 w-4" /> SOLICITAR UN NUEVO ENLACE
          </Link>
        </Button>
      </div>
    )
  }
  
  if (success) {
    return (
        <div className="text-center space-y-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-black text-foreground">¡Contraseña Actualizada!</h3>
            <p className="text-muted-foreground">
              Tu contraseña ha sido cambiada con éxito. Serás redirigido al inicio de sesión en unos segundos.
            </p>
            <Button asChild className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest">
              <Link href="/auth/login">
                INICIAR SESIÓN AHORA
              </Link>
            </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleResetPassword} className="space-y-6 text-left">
      <div className="space-y-2">
        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Nueva Contraseña</Label>
        <div className="relative">
          <Input 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={6}
            className="h-14 rounded-2xl bg-card border-none ring-1 ring-border focus:ring-4 focus:ring-primary/10 transition-all font-bold px-6" 
            placeholder="••••••••" 
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Confirmar Nueva Contraseña</Label>
        <div className="relative">
          <Input 
            type={showPassword ? "text" : "password"} 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            className="h-14 rounded-2xl bg-card border-none ring-1 ring-border focus:ring-4 focus:ring-primary/10 transition-all font-bold px-6" 
            placeholder="••••••••" 
          />
           <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
        </div>
      </div>
      <Button 
        type="submit"
        className="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'ESTABLECER NUEVA CONTRASEÑA'}
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3.5rem] overflow-hidden bg-card p-2 ring-1 ring-border/50">
        <div className="bg-muted/30 rounded-[3rem] p-10 md:p-14 text-center">
            <CardHeader className="p-0 mb-8 space-y-4">
                <div className="flex justify-center">
                <div className="h-20 w-20 rounded-[2.2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner rotate-3">
                    <KeyRound className="h-10 w-10" />
                </div>
                </div>
                <div className="space-y-1">
                <CardTitle className="text-3xl font-headline font-black text-foreground tracking-tight">Establecer Nueva Contraseña</CardTitle>
                <p className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Seguridad Sync Connect</p>
                </div>
            </CardHeader>
            <CardContent>
                <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
                    <ResetPasswordForm />
                </Suspense>
            </CardContent>
        </div>
      </Card>
    </div>
  )
}
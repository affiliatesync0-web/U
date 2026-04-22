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
import { Loader2, KeyRound, ArrowLeft, Eye, EyeOff, CheckCircle, ShieldCheck, AlertCircle, ShieldAlert, ArrowRight, Lock, Key } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const auth = useAuth()

  const [code, setCode] = useState<string>('')
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  // Autodetectar código si viene en la URL (aunque priorizamos el manual)
  useEffect(() => {
    const oobCode = searchParams.get('oobCode');
    if (oobCode && !code) {
      setCode(oobCode)
      handleVerifyCode(oobCode)
    }
  }, [searchParams])

  const handleVerifyCode = async (codeToVerify: string) => {
    if (!codeToVerify || codeToVerify.length < 5) return;
    setIsVerifying(true);
    try {
      await verifyPasswordResetCode(auth, codeToVerify.trim());
      setIsValidCode(true);
      toast({ title: "Código Validado", description: "Identidad confirmada. Define tu nueva clave." });
    } catch (error) {
      console.error("Invalid reset code:", error);
      setIsValidCode(false);
      toast({ variant: "destructive", title: "Código Inválido", description: "El código no es correcto o ya expiró." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !isValidCode) return;
    
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Las contraseñas no coinciden" });
      return;
    }
    if (password.length < 6) {
        toast({ variant: "destructive", title: "Contraseña muy corta" });
          return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, code.trim(), password);
      setSuccess(true);
      toast({
        title: "¡Acceso Restaurado!",
        description: "Tu contraseña ha sido actualizada con éxito."
      });
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: "Sesión expirada. Solicita un nuevo código."
      });
    } finally {
      setLoading(false);
    }
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
                  Tu contraseña ha sido actualizada. Entrando al portal...
                </p>
            </div>
            <Button asChild className="w-full h-18 rounded-2xl bg-[#131921] text-white font-black text-xs uppercase tracking-widest shadow-2xl">
              <Link href="/auth/login">INICIAR SESIÓN AHORA</Link>
            </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {!isValidCode ? (
        <div className="space-y-6">
          <div className="space-y-2 text-left">
            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Ingresa el Código del Gmail</Label>
            <div className="relative">
              <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <Input 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Pega tu código aquí..."
                className="h-18 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 pl-14 pr-6 font-mono font-black text-center text-xl tracking-[4px] text-primary"
              />
            </div>
          </div>
          <Button 
            onClick={() => handleVerifyCode(code)}
            disabled={isVerifying || code.length < 5}
            className="w-full h-18 rounded-2xl bg-[#131921] text-white font-black uppercase text-xs shadow-xl transition-all hover:bg-slate-800"
          >
            {isVerifying ? <Loader2 className="animate-spin h-6 w-6" /> : "VERIFICAR CÓDIGO MAESTRO"}
          </Button>
          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
             <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
             <p className="text-[10px] text-amber-800 font-bold uppercase tracking-tight leading-relaxed">
               El código fue enviado a tu bandeja de entrada o Spam. Los códigos son sensibles a mayúsculas.
             </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-6 text-left">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100 mb-6">
             <CheckCircle className="h-4 w-4 text-green-600" />
             <span className="text-[10px] font-black text-green-700 uppercase">IDENTIDAD VERIFICADA ✓</span>
          </div>

          <div className="space-y-2">
            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Nueva Contraseña</Label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                minLength={6}
                className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-6 font-bold" 
                placeholder="Mínimo 6 caracteres" 
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
                className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-6 font-bold" 
                placeholder="Repite la contraseña" 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full h-18 rounded-[2rem] bg-[#131921] text-white font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 group"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin h-6 w-6" /> : (
                <>ACTUALIZAR CONTRASEÑA <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </form>
      )}
      
      <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mt-6">
        Por seguridad, los códigos son de un solo uso y expiran cada 15 minutos.
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#131921] flex flex-col justify-center items-center p-4">
      <div className="mb-10">
        <Link href="/auth/login" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-black uppercase text-[10px] tracking-widest group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Volver al portal</span>
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[4rem] overflow-hidden bg-white p-2">
        <div className="bg-slate-50/30 rounded-[3.5rem] p-10 md:p-14 text-center">
            <CardHeader className="p-0 mb-10 space-y-6">
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-[2.5rem] bg-[#131921] flex items-center justify-center text-[#ff9900] shadow-2xl rotate-6 border-4 border-slate-800">
                        <Lock className="h-10 w-10" />
                    </div>
                </div>
                <div className="space-y-2">
                    <CardTitle className="text-4xl font-headline font-black text-slate-900 tracking-tighter leading-none italic uppercase">
                        Sync <span className="text-[#ff9900]">Security</span>
                    </CardTitle>
                    <p className="font-bold text-[9px] uppercase tracking-[0.4em] text-slate-400">Verificación de Código</p>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Suspense fallback={<div className="py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-[#ff9900] opacity-20" /></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </CardContent>
        </div>
      </Card>
      
      <footer className="mt-12 text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] text-center">
        Encrypted Access • Sync Connect Nicaragua
      </footer>
    </div>
  )
}
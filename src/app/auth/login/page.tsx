
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Target, ArrowLeft, Eye, EyeOff, Loader2, MailCheck, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth } from '@/firebase'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'

export default function AffiliateLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const auth = useAuth()
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: t.language === 'es' ? "Bienvenido" : "Welcome",
        description: t.language === 'es' ? "Sesión iniciada correctamente." : "Logged in successfully.",
      })
      router.push('/dashboard/affiliate')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: t.language === 'es' ? "Credenciales incorrectas o cuenta no existe." : "Invalid credentials or account does not exist.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Requerido",
        description: t.enterEmailFirst,
      })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Email Inválido",
        description: t.language === 'es' ? "Por favor ingresa un correo electrónico válido." : "Please enter a valid email address.",
      })
      return
    }

    setResetLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      toast({
        title: t.language === 'es' ? "Correo de Recuperación Enviado" : "Reset Email Sent",
        description: t.language === 'es' 
          ? `Se ha enviado un enlace seguro a ${email} desde nuestra cuenta verificada. Revisa tu bandeja de entrada.` 
          : `A secure reset link has been sent to ${email} from our verified account. Please check your inbox.`,
      })
    } catch (error: any) {
      console.error("Password reset error:", error)
      let message = t.language === 'es' ? "No se pudo enviar el correo. Verifica el email." : "Could not send reset email. Check your email address."
      
      if (error.code === 'auth/user-not-found') {
        message = t.language === 'es' ? "No existe una cuenta registrada con este correo." : "No account found with this email."
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">{t.language === 'es' ? "Volver al inicio" : "Back to home"}</span>
      </Link>

      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
              <Target className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline font-bold text-primary">{t.affiliatePortal}</CardTitle>
          <CardDescription>
            {t.language === 'es' ? "Ingresa tus datos para acceder a tu panel." : "Enter your details to access your dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com" 
                required 
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t.password}</Label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-xs text-primary font-bold hover:underline flex items-center gap-1 transition-colors"
                  disabled={resetLoading}
                >
                  {resetLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <MailCheck className="h-3 w-3" />}
                  {t.forgotPassword}
                </button>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••" 
                  required 
                  className="pr-10"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 font-bold py-6 shadow-lg transition-all mt-4" 
              disabled={loading}
            >
              {loading ? (t.language === 'es' ? "Iniciando..." : "Logging in...") : t.login}
            </Button>
          </form>
        </CardContent>
        <div className="px-6 pb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[10px] text-primary font-bold uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3" /> Acceso Protegido por AffiliateSync
          </div>
        </div>
        <CardFooter className="justify-center border-t py-6 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {t.language === 'es' ? "¿No tienes cuenta?" : "Don't have an account?"} <Link href="/auth/register" className="text-primary font-bold hover:underline">{t.getStarted}</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

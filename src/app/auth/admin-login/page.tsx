"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useAuth } from '@/firebase'
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const auth = useAuth()
  const [loading, setLoading] = useState(false)

  const handleGoogleAdminLogin = async () => {
    if (!auth) return;
    
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // RESTRICCIÓN DE SEGURIDAD: Solo este correo puede entrar al panel admin
      if (user?.email === 'affiliatesync0@gmail.com') {
        toast({
          title: "Acceso concedido",
          description: "Bienvenido al panel administrativo central.",
        });
        router.push('/dashboard/admin');
      } else {
        // Si es otro correo, cerramos la sesión inmediatamente
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Acceso denegado",
          description: "Tu cuenta de Google no tiene permisos administrativos en Sync Connect.",
        });
      }
    } catch (error: any) {
      console.error("Admin Login Error:", error);
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: "No pudimos conectar con Google. Por favor, intenta de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-bold uppercase text-[10px] tracking-widest">
        <ArrowLeft className="h-4 w-4" />
        <span>Volver al inicio</span>
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-none rounded-[3rem] overflow-hidden bg-white p-2">
        <div className="bg-slate-50/50 rounded-[2.5rem] p-10 md:p-12">
          <CardHeader className="text-center space-y-4 p-0 mb-10">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-[2rem] bg-slate-900 flex items-center justify-center text-primary shadow-2xl rotate-3">
                <ShieldAlert className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-headline font-black text-slate-900 tracking-tight leading-none">
                {t.adminTitle}
              </CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-400">
                Solo Personal Autorizado
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-6">
              <p className="text-sm text-slate-500 text-center font-medium leading-relaxed">
                Para gestionar la red de Sync Connect, debes iniciar sesión con la cuenta de Google principal de la plataforma.
              </p>
              
              <Button 
                onClick={handleGoogleAdminLogin}
                className="w-full h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-3" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-3.3 3.27-8.14 3.27-13.41z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
                    </svg>
                    Entrar como Administrador
                  </>
                )}
              </Button>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conexión Encriptada SSL</span>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

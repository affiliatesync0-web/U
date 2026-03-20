"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Hardcoded credentials for the prototype
    if (username === 'uriel' && password === '190710') {
      setTimeout(() => {
        setLoading(false)
        toast({
          title: "Acceso concedido",
          description: "Bienvenido al panel administrativo.",
        })
        router.push('/dashboard/admin')
      }, 1000)
    } else {
      setTimeout(() => {
        setLoading(false)
        toast({
          variant: "destructive",
          title: "Error",
          description: t.invalidCredentials,
        })
      }, 800)
    }
  }

  return (
    <div className="min-h-screen bg-[#EFF2F4] flex flex-col justify-center items-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Volver al inicio</span>
      </Link>

      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
              <ShieldAlert className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline font-bold text-[#2870A3]">{t.adminTitle}</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para gestionar la red.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t.username}</Label>
              <Input 
                id="username" 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuario" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••" 
                required 
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#2870A3] hover:bg-[#1e5a82] font-semibold py-6 shadow-lg transition-all mt-4" 
              disabled={loading}
            >
              {loading ? "Verificando..." : t.login}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

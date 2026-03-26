"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Smartphone, Bot, QrCode, RefreshCw, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase'
import { doc } from 'firebase/firestore'

export default function BotSettingsPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  const [isSaving, setIsSaving] = useState(false)

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'affiliates', user.uid);
  }, [db, user]);

  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const [formData, setFormData] = useState({
    whatsappNumber: '',
    botEnabled: false,
    botWelcomeMessage: ''
  })

  // Sincronizar datos del perfil cuando carguen
  useEffect(() => {
    if (profile) {
      setFormData({
        whatsappNumber: profile.whatsappNumber || '',
        botEnabled: profile.botEnabled || false,
        botWelcomeMessage: profile.botWelcomeMessage || '¡Hola! Soy tu asistente de ventas de Sync Connect. ¿En qué producto estás interesado?'
      })
    }
  }, [profile])

  const handleSave = () => {
    if (!profileRef || !user) return
    setIsSaving(true)
    
    // Usamos setDocumentNonBlocking con merge: true para asegurar la compatibilidad con las reglas de escritura
    setDocumentNonBlocking(profileRef, {
      whatsappNumber: formData.whatsappNumber.trim(),
      botEnabled: formData.botEnabled,
      botWelcomeMessage: formData.botWelcomeMessage.trim(),
      updatedAt: new Date().toISOString()
    }, { merge: true })

    // Feedback visual inmediato
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: t.language === 'es' ? "Configuración Guardada" : "Settings Saved",
        description: t.language === 'es' ? "Tu bot ha sido actualizado correctamente." : "Your bot has been updated successfully.",
      })
    }, 1000)
  }

  if (profileLoading) {
    return (
      <DashboardShell role="affiliate">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="affiliate">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-headline font-bold text-primary">{t.botSettings}</h1>
          <p className="text-muted-foreground">{t.botFeatures}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  {t.whatsappConnection}
                </CardTitle>
                <CardDescription>{t.whatsappHelp}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber" className="font-bold">{t.whatsappNumberLabel}</Label>
                  <Input 
                    id="whatsappNumber" 
                    placeholder="50588888888" 
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                    className="h-12 rounded-xl bg-slate-50 font-mono text-lg border-none ring-1 ring-slate-200"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                  <Bot className="h-5 w-5 text-[#A37EDC]" />
                  {t.botStatus}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">{t.enableBot}</Label>
                    <p className="text-xs text-muted-foreground">Activa el asistente para respuestas automáticas.</p>
                  </div>
                  <Switch 
                    checked={formData.botEnabled}
                    onCheckedChange={(val) => setFormData({...formData, botEnabled: val})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage" className="font-bold">{t.botWelcomeMessageLabel}</Label>
                  <Textarea 
                    id="welcomeMessage" 
                    placeholder="¡Hola! ¿En qué producto estás interesado?"
                    value={formData.botWelcomeMessage}
                    onChange={(e) => setFormData({...formData, botWelcomeMessage: e.target.value})}
                    className="min-h-[120px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 bg-slate-50/30">
                <Button 
                  onClick={handleSave} 
                  className="w-full bg-primary hover:bg-primary/90 font-bold h-12 rounded-xl shadow-lg transition-all"
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {t.saveChanges}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden rounded-[2.5rem]">
               <CardHeader className="text-center pb-2 pt-10">
                  <CardTitle className="text-2xl font-headline font-black uppercase tracking-widest text-primary">Sincronización</CardTitle>
               </CardHeader>
               <CardContent className="flex flex-col items-center py-8 gap-6">
                  <div className="relative p-6 bg-white rounded-[2rem] shadow-2xl">
                    <QrCode className="h-48 w-48 text-slate-900" />
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity rounded-[2rem] cursor-not-allowed">
                       <p className="text-slate-900 font-black text-center px-6 text-sm">Esperando conexión de dispositivo...</p>
                    </div>
                  </div>
                  <p className="text-center text-xs text-slate-400 max-w-[240px] leading-relaxed font-medium">
                    {t.qrCodeSim}
                  </p>
               </CardContent>
               <CardFooter className="bg-white/5 py-8 border-t border-white/10">
                  <div className="flex items-start gap-4 px-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Info className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                      El sistema utiliza un motor de lenguaje natural para procesar las dudas de tus clientes sobre el catálogo de productos activo.
                    </p>
                  </div>
               </CardFooter>
            </Card>

            <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] shadow-inner space-y-4">
               <h3 className="text-sm font-black text-blue-900 uppercase tracking-tighter flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" /> Funcionamiento del Bot
               </h3>
               <ul className="space-y-4">
                  {[
                    "Responde dudas sobre precios y categorías.",
                    "Proporciona los datos bancarios para el depósito.",
                    "Recibe el número de referencia del voucher.",
                    "Confirma al cliente que la venta está en revisión."
                  ].map((text, i) => (
                    <li key={i} className="text-xs text-blue-800 flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-blue-200/50 flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</div>
                      <span className="pt-0.5">{text}</span>
                    </li>
                  ))}
               </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

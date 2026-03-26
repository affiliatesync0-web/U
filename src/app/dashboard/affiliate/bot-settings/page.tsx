"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { MessageSquare, Smartphone, Bot, QrCode, RefreshCw, CheckCircle2, Info } from 'lucide-react'
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

  // Sincronizar estado local cuando carguen los datos del perfil
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
    if (!profileRef) return
    setIsSaving(true)
    
    // Usamos setDocumentNonBlocking con merge: true para asegurar que el documento se actualice correctamente
    setDocumentNonBlocking(profileRef, {
      whatsappNumber: formData.whatsappNumber,
      botEnabled: formData.botEnabled,
      botWelcomeMessage: formData.botWelcomeMessage
    }, { merge: true })

    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: t.language === 'es' ? "Configuración Guardada" : "Settings Saved",
        description: t.language === 'es' ? "Tu bot de WhatsApp ha sido actualizado." : "Your WhatsApp bot has been updated.",
      })
    }, 1000)
  }

  return (
    <DashboardShell role="affiliate">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">{t.botSettings}</h1>
          <p className="text-muted-foreground">{t.botFeatures}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  {t.whatsappConnection}
                </CardTitle>
                <CardDescription>{t.whatsappHelp}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">{t.whatsappNumberLabel}</Label>
                  <Input 
                    id="whatsappNumber" 
                    placeholder="50588888888" 
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                    className="h-12 rounded-xl bg-slate-50 font-mono text-lg"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                  <Bot className="h-5 w-5 text-[#A37EDC]" />
                  {t.botStatus}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">{t.enableBot}</Label>
                    <p className="text-xs text-muted-foreground">Activa el asistente de IA para responder por ti.</p>
                  </div>
                  <Switch 
                    checked={formData.botEnabled}
                    onCheckedChange={(val) => setFormData({...formData, botEnabled: val})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">{t.botWelcomeMessageLabel}</Label>
                  <Textarea 
                    id="welcomeMessage" 
                    placeholder="¡Hola! ¿Cómo puedo ayudarte hoy?"
                    value={formData.botWelcomeMessage}
                    onChange={(e) => setFormData({...formData, botWelcomeMessage: e.target.value})}
                    className="min-h-[120px] rounded-2xl bg-slate-50"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button 
                  onClick={handleSave} 
                  className="w-full bg-primary hover:bg-primary/90 font-bold h-12 rounded-xl shadow-lg"
                  disabled={isSaving || profileLoading}
                >
                  {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {t.saveChanges}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden rounded-[2rem]">
               <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl font-headline font-black uppercase tracking-widest text-primary">Vincular Dispositivo</CardTitle>
               </CardHeader>
               <CardContent className="flex flex-col items-center py-8 gap-6">
                  <div className="relative p-4 bg-white rounded-3xl shadow-2xl">
                    <QrCode className="h-48 w-48 text-slate-900" />
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity rounded-3xl cursor-not-allowed">
                       <p className="text-slate-900 font-black text-center px-4">Conectando con Servidor Bot...</p>
                    </div>
                  </div>
                  <p className="text-center text-xs text-slate-400 max-w-[200px] leading-relaxed">
                    {t.qrCodeSim}
                  </p>
               </CardContent>
               <CardFooter className="bg-primary/10 py-6 border-t border-slate-800">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-1" />
                    <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                      El bot utiliza tecnología GPT-4 para analizar tu catálogo y responder a los clientes. Mantén esta pestaña abierta para una sincronización óptima durante la fase beta.
                    </p>
                  </div>
               </CardFooter>
            </Card>

            <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] space-y-4">
               <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" /> ¿Cómo funciona el Bot?
               </h3>
               <ul className="space-y-3">
                  {[
                    "Detecta interés en productos específicos.",
                    "Explica beneficios y características automáticamente.",
                    "Solicita el comprobante de depósito (Voucher).",
                    "Te notifica cuando una venta está lista para ser validada."
                  ].map((text, i) => (
                    <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5" />
                      {text}
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
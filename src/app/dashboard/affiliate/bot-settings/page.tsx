
"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Smartphone, Bot, Send, RefreshCw, CheckCircle2, Info, Loader2, User, Globe, Copy, Check, QrCode, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking, useCollection } from '@/firebase'
import { doc, collection } from 'firebase/firestore'
import { processBotMessage } from '@/ai/flows/whatsapp-bot-flow'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'bot'
  content: string
}

export default function BotSettingsPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  const [isSaving, setIsSaving] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'affiliates', user.uid);
  }, [db, user]);

  const productsRef = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'products');
  }, [db]);

  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);
  const { data: products } = useCollection(productsRef);

  const [formData, setFormData] = useState({
    whatsappNumber: '',
    botEnabled: false,
    botWelcomeMessage: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        whatsappNumber: profile.whatsappNumber || '',
        botEnabled: profile.botEnabled || false,
        botWelcomeMessage: profile.botWelcomeMessage || '¡Hola! Soy tu asistente de ventas de Sync Connect. ¿En qué producto estás interesado?'
      })
      if (messages.length === 0) {
        setMessages([{ role: 'bot', content: profile.botWelcomeMessage || '¡Hola! ¿En qué puedo ayudarte hoy?' }])
      }
    }
  }, [profile])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSave = () => {
    if (!profileRef || !user) return
    setIsSaving(true)
    
    const cleanNumber = formData.whatsappNumber.replace(/\D/g, '');

    setDocumentNonBlocking(profileRef, {
      whatsappNumber: cleanNumber,
      botEnabled: formData.botEnabled,
      botWelcomeMessage: formData.botWelcomeMessage.trim(),
      updatedAt: new Date().toISOString()
    }, { merge: true })

    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: t.language === 'es' ? "Configuración Guardada" : "Settings Saved",
        description: t.language === 'es' ? "Tu bot ha sido actualizado correctamente." : "Your bot has been updated successfully.",
      })
    }, 1000)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isTyping) return

    const userMsg = chatInput.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatInput('')
    setIsTyping(true)

    try {
      const response = await processBotMessage({
        userMessage: userMsg,
        affiliateName: profile?.firstName || 'Asistente',
        welcomeMessage: formData.botWelcomeMessage,
        catalog: (products || []).map(p => ({
          name: p.name,
          price: p.price,
          code: p.code,
          description: p.description
        })),
        history: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content
        }))
      })

      setMessages(prev => [...prev, { role: 'bot', content: response.reply }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: "Lo siento, tuve un pequeño problema técnico. ¿Puedes repetir eso?" }])
    } finally {
      setIsTyping(false)
    }
  }

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "URL Copiada",
      description: "Pega esta URL en la configuración de Webhook de tu proveedor de WhatsApp.",
    });
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
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-headline font-bold text-primary">{t.botSettings}</h1>
          <p className="text-muted-foreground">{t.botFeatures}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="text-lg font-headline flex items-center gap-2 text-primary">
                  <Zap className="h-5 w-5" />
                  ¿Cómo conectar mi WhatsApp?
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <p className="text-sm font-medium">Usa un proveedor de API (Twilio, Gupshup o Gateway Local).</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <p className="text-sm font-medium">Busca la sección de <strong>Webhook URL</strong> en su panel.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <p className="text-sm font-medium">Copia y pega la URL que aparece abajo en tu proveedor.</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl border border-dashed flex flex-col gap-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tu URL de Webhook</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={webhookUrl} className="h-9 text-[10px] font-mono bg-white" />
                      <Button variant="secondary" size="icon" className="h-9 w-9" onClick={copyToClipboard}>
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  {t.whatsappNumberLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber" className="font-bold">Número de Teléfono</Label>
                  <Input 
                    id="whatsappNumber" 
                    placeholder="50588888888" 
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                    className="h-12 rounded-xl bg-slate-50 font-mono text-lg border-none ring-1 ring-slate-200"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Incluye el código de país sin el símbolo + (ej: 505 para Nicaragua).</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
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
                    <p className="text-xs text-muted-foreground">Activa la Inteligencia Artificial.</p>
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

          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] flex flex-col h-[750px]">
               <CardHeader className="bg-slate-900 text-white pb-6 pt-8 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                        <Bot className="h-7 w-7" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-headline font-black uppercase tracking-widest text-primary">Simulador IA</CardTitle>
                        <p className="text-[10px] text-slate-400 font-bold">Prueba las respuestas de tu bot aquí</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black border border-green-500/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      SISTEMA ACTIVO
                    </div>
                  </div>
               </CardHeader>
               
               <CardContent className="flex-1 overflow-hidden p-0 bg-slate-50/50 flex flex-col">
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                      {messages.map((msg, i) => (
                        <div key={i} className={cn(
                          "flex items-end gap-2 max-w-[85%]",
                          msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}>
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                            msg.role === 'user' ? "bg-slate-200" : "bg-primary text-white"
                          )}>
                            {msg.role === 'user' ? <User className="h-4 w-4 text-slate-600" /> : <Bot className="h-4 w-4" />}
                          </div>
                          <div className={cn(
                            "p-4 rounded-2xl text-sm font-medium shadow-sm",
                            msg.role === 'user' ? "bg-white text-slate-800 rounded-br-none" : "bg-slate-900 text-white rounded-bl-none"
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex items-end gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="bg-slate-900 text-white p-4 rounded-2xl rounded-bl-none shadow-sm">
                             <div className="flex gap-1">
                               <div className="h-1.5 w-1.5 bg-white/40 rounded-full animate-bounce" />
                               <div className="h-1.5 w-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                               <div className="h-1.5 w-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                             </div>
                          </div>
                        </div>
                      )}
                      <div ref={scrollRef} />
                    </div>
                  </ScrollArea>
                  
                  <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                       <Input 
                        placeholder="Escribe para probar las respuestas del bot..." 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="h-12 rounded-full px-6 bg-slate-50 border-none ring-1 ring-slate-200 flex-1"
                       />
                       <Button 
                        type="submit" 
                        size="icon" 
                        className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg shrink-0"
                        disabled={!chatInput.trim() || isTyping}
                       >
                         <Send className="h-5 w-5" />
                       </Button>
                    </form>
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

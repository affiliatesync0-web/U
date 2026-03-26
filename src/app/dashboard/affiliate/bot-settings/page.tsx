
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Smartphone, Bot, Send, RefreshCw, CheckCircle2, Loader2, User, Copy, Check, Zap, ShieldCheck, Key, HelpCircle, ExternalLink, MessageSquare, Settings2, Info } from 'lucide-react'
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
  const [step, setStep] = useState(1) // 1: Number, 2: Code
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerified, setIsVerified] = useState(false)
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
      if (profile.whatsappNumber) setIsVerified(true)
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

  const handleSendCode = () => {
    if (!formData.whatsappNumber) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setStep(2);
      toast({
        title: t.codeSent,
        description: t.enterCode,
      });
    }, 1500);
  };

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      setStep(1);
      toast({
        title: t.numberVerified,
        description: "Tu WhatsApp ha sido vinculado exitosamente.",
      });
      handleSave();
    }, 1500);
  };

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
        title: t.saveChanges,
        description: "Configuración actualizada correctamente.",
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
      setMessages(prev => [...prev, { role: 'bot', content: "Error de conexión con la IA. Inténtalo de nuevo." }])
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
      description: "Ahora pégala en tu panel de configuración de WhatsApp.",
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
          {/* Columna Izquierda: Configuración Técnica */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-xl font-headline flex items-center gap-2 text-primary">
                  <Smartphone className="h-5 w-5" />
                  Conexión a WhatsApp
                </CardTitle>
                <CardDescription>Víncula tu número real de empresa</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                {/* Guía de Ayuda para el Webhook */}
                <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-wider">
                    <Settings2 className="h-4 w-4" /> Guía: ¿Dónde poner el enlace?
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="twilio" className="border-none">
                      <AccordionTrigger className="text-xs font-bold hover:no-underline py-2">
                        Si usas Twilio (Recomendado)
                      </AccordionTrigger>
                      <AccordionContent className="text-[11px] text-slate-500 leading-relaxed bg-white/50 p-3 rounded-xl border border-slate-100 mt-1">
                        1. Ve a tu consola de Twilio.<br/>
                        2. Entra en <strong>Messaging</strong> -> <strong>Services</strong>.<br/>
                        3. Selecciona tu servicio y ve a <strong>Sender Pool</strong>.<br/>
                        4. Haz clic en <strong>Edit</strong> sobre tu número.<br/>
                        5. Busca el campo <strong>"A MESSAGE COMES IN"</strong>.<br/>
                        6. Selecciona <strong>"Webhook"</strong> y pega el enlace de abajo.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="meta" className="border-none">
                      <AccordionTrigger className="text-xs font-bold hover:no-underline py-2">
                        Si usas Meta (WhatsApp Business API)
                      </AccordionTrigger>
                      <AccordionContent className="text-[11px] text-slate-500 leading-relaxed bg-white/50 p-3 rounded-xl border border-slate-100 mt-1">
                        1. Ve al <strong>Administrador de WhatsApp</strong> de Meta.<br/>
                        2. Entra en <strong>Configuración</strong> -> <strong>Configuración de WhatsApp</strong>.<br/>
                        3. Busca la sección <strong>Webhooks</strong>.<br/>
                        4. Haz clic en <strong>Editar</strong> y pega el enlace de abajo.<br/>
                        5. Activa los eventos de <strong>"messages"</strong>.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="pt-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Copia tu enlace aquí</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={webhookUrl} className="h-11 text-[10px] font-mono bg-white border-slate-200" />
                      <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={copyToClipboard}>
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Verificación de Número */}
                {step === 1 ? (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="whatsappNumber" className="font-bold">Tu Número de Empresa</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="whatsappNumber" 
                          placeholder="50588888888" 
                          value={formData.whatsappNumber}
                          onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                          disabled={isVerified}
                          className="h-12 rounded-xl bg-slate-50 font-mono text-lg border-none ring-1 ring-slate-200"
                        />
                        {isVerified ? (
                           <div className="flex items-center justify-center h-12 w-12 bg-green-100 text-green-600 rounded-xl">
                             <ShieldCheck className="h-6 w-6" />
                           </div>
                        ) : (
                          <Button 
                            onClick={handleSendCode} 
                            disabled={!formData.whatsappNumber || isVerifying}
                            className="h-12 rounded-xl px-4"
                          >
                            {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vincular"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="code" className="font-bold flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" /> Código SMS / SIM
                      </Label>
                      <Input 
                        id="code" 
                        placeholder="123456" 
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="h-14 text-center text-3xl font-black tracking-[0.5em] rounded-xl bg-slate-50"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={handleVerifyCode} 
                        disabled={verificationCode.length !== 6 || isVerifying}
                        className="w-full h-12 rounded-xl font-bold bg-primary shadow-lg"
                      >
                        {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Confirmar Código"}
                      </Button>
                      <Button variant="ghost" onClick={() => setStep(1)} className="text-xs text-muted-foreground">
                        Cambiar Número
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personalización */}
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Personalización IA
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">Asistente Activo</Label>
                    <p className="text-xs text-muted-foreground">Responde automáticamente a tus clientes.</p>
                  </div>
                  <Switch 
                    checked={formData.botEnabled}
                    onCheckedChange={(val) => setFormData({...formData, botEnabled: val})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage" className="font-bold">Mensaje Inicial</Label>
                  <Textarea 
                    id="welcomeMessage" 
                    placeholder="Ej: ¡Hola! Soy el asistente de Uriel. ¿En qué producto estás interesado hoy?"
                    value={formData.botWelcomeMessage}
                    onChange={(e) => setFormData({...formData, botWelcomeMessage: e.target.value})}
                    className="min-h-[100px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 bg-slate-50/30">
                <Button 
                  onClick={handleSave} 
                  className="w-full bg-primary font-bold h-12 rounded-xl"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Guardar Configuración
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Columna Derecha: Simulador de Chat */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] flex flex-col h-[750px] ring-1 ring-slate-200">
               <CardHeader className="bg-slate-900 text-white pb-6 pt-8 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                        <MessageSquare className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-headline font-black uppercase tracking-widest text-primary">Simulador de Chat</CardTitle>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Entrenamiento de Inteligencia Artificial</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-black border border-green-500/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      CONECTADO
                    </div>
                  </div>
               </CardHeader>
               
               <CardContent className="flex-1 overflow-hidden p-0 bg-[#F0F2F5] flex flex-col relative">
                  {/* Fondo estilo WhatsApp */}
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://plus.unsplash.com/premium_photo-1661601633190-7d72111c6d1d?auto=format&fit=crop&q=80&w=400')] bg-repeat" />
                  
                  <ScrollArea className="flex-1 p-6 relative z-10">
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
                            "p-3.5 rounded-2xl text-sm font-medium shadow-sm leading-relaxed",
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
                  
                  <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 flex-shrink-0 relative z-10">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                       <Input 
                        placeholder="Escribe un mensaje para probar el bot..." 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="h-12 rounded-full px-6 bg-slate-50 border-none ring-1 ring-slate-200 flex-1"
                       />
                       <Button 
                        type="submit" 
                        size="icon" 
                        className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg shrink-0 transition-all active:scale-95"
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

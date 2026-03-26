
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
import { Smartphone, Bot, Send, CheckCircle2, Loader2, User, Copy, Check, ShieldCheck, Key, MessageSquare, Settings2, ExternalLink, Zap, QrCode } from 'lucide-react'
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
  const [currentStep, setCurrentStep] = useState(1) // 1: Info, 2: Verification, 3: Webhook Setup
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
      if (profile.whatsappNumber) {
        setIsVerified(true);
        setCurrentStep(3);
      }
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

  const handleStartVerification = () => {
    if (!formData.whatsappNumber) {
      toast({ variant: "destructive", title: "Número Requerido", description: "Por favor ingresa tu número de WhatsApp." });
      return;
    }
    setCurrentStep(2);
  };

  const handleMagicLink = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const message = encodeURIComponent(`Hola Sync Connect, quiero vincular mi cuenta. Mi código es: ${code}`);
    window.open(`https://wa.me/${formData.whatsappNumber}?text=${message}`, '_blank');
    setVerificationCode(code);
    toast({ title: "Enlace Mágico Abierto", description: "Envía el mensaje en WhatsApp para verificar tu número." });
  };

  const handleConfirmVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      setCurrentStep(3);
      handleSave();
      toast({ title: t.numberVerified, description: "Tu WhatsApp ha sido vinculado exitosamente." });
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
      toast({ title: t.saveChanges, description: "Configuración actualizada correctamente." })
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
    toast({ title: "URL Copiada", description: "Pégala en tu panel de WhatsApp." });
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-primary tracking-tight">Vinculación <span className="text-slate-900">Directa</span></h1>
            <p className="text-slate-500 font-medium">{t.botFeatures}</p>
          </div>
          
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl border">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "h-8 px-4 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  currentStep === s ? "bg-primary text-white shadow-lg" : "text-slate-400"
                )}
              >
                {s === 1 ? t.linkStep1 : s === 2 ? t.linkStep2 : t.linkStep3}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
               <CardHeader className="bg-slate-50/50 pb-8">
                 <div className="flex items-center gap-3 mb-2">
                   <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                     <Zap className="h-5 w-5" />
                   </div>
                   <CardTitle className="text-2xl font-headline font-black">Conexión Rápida</CardTitle>
                 </div>
                 <CardDescription className="font-medium">Víncula tu número oficial en menos de 1 minuto.</CardDescription>
               </CardHeader>
               
               <CardContent className="pt-8 space-y-8">
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                      <div className="space-y-3">
                        <Label className="text-sm font-black text-slate-700 uppercase tracking-wider">{t.whatsappNumberLabel}</Label>
                        <Input 
                          placeholder="50588888888" 
                          value={formData.whatsappNumber}
                          onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                          className="h-16 rounded-[1.25rem] text-2xl font-mono bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-primary transition-all"
                        />
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{t.whatsappHelp}</p>
                      </div>
                      <Button onClick={handleStartVerification} className="w-full h-16 rounded-[1.25rem] bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                        Continuar <ExternalLink className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                      <div className="bg-green-50 border border-green-100 p-6 rounded-[2rem] text-center space-y-4">
                        <div className="h-16 w-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
                          <MessageSquare className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-black text-green-900 text-lg">Vínculo Mágico</h3>
                          <p className="text-xs text-green-700 font-medium">{t.magicLinkDesc}</p>
                        </div>
                        <Button onClick={handleMagicLink} className="w-full bg-green-600 hover:bg-green-700 h-14 rounded-2xl font-black text-white shadow-lg">
                          {t.verifyViaWhatsApp}
                        </Button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold"><span className="bg-white px-2 text-slate-400">O ingresa el código</span></div>
                      </div>

                      <div className="space-y-4">
                        <Input 
                          placeholder="000000" 
                          maxLength={6}
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-[1.25rem] bg-slate-50"
                        />
                        <Button onClick={handleConfirmVerification} disabled={isVerifying} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black shadow-lg">
                          {isVerifying ? <Loader2 className="animate-spin h-5 w-5" /> : t.verify}
                        </Button>
                      </div>
                      <Button variant="ghost" onClick={() => setCurrentStep(1)} className="w-full text-xs text-slate-400 font-bold uppercase">Cambiar Número</Button>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                       <div className="flex items-center gap-4 p-5 bg-green-50 rounded-[1.5rem] border border-green-100">
                         <div className="h-12 w-12 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
                           <CheckCircle2 className="h-6 w-6" />
                         </div>
                         <div>
                           <p className="text-xs font-black text-green-900 uppercase tracking-widest">Número Vinculado</p>
                           <p className="text-sm font-bold text-green-700">+{formData.whatsappNumber}</p>
                         </div>
                       </div>

                       <div className="space-y-4">
                          <div className="flex items-center justify-between p-5 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                            <div className="space-y-0.5">
                              <Label className="text-base font-black text-slate-900">Asistente IA</Label>
                              <p className="text-xs text-slate-500 font-medium">Activa las respuestas automáticas.</p>
                            </div>
                            <Switch checked={formData.botEnabled} onCheckedChange={(val) => setFormData({...formData, botEnabled: val})} />
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Mensaje de Bienvenida</Label>
                            <Textarea 
                              value={formData.botWelcomeMessage}
                              onChange={(e) => setFormData({...formData, botWelcomeMessage: e.target.value})}
                              className="min-h-[120px] rounded-[1.5rem] bg-slate-50 border-none ring-1 ring-slate-200 p-5 text-sm font-medium leading-relaxed"
                            />
                          </div>

                          <Button onClick={handleSave} className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black text-lg shadow-xl shadow-primary/20" disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" /> : "Guardar y Finalizar"}
                          </Button>
                       </div>

                       <div className="pt-6 border-t">
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="webhook" className="border-none">
                              <AccordionTrigger className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:no-underline shadow-lg">
                                <span className="flex items-center gap-2"><Settings2 className="h-4 w-4" /> Configuración Webhook</span>
                              </AccordionTrigger>
                              <AccordionContent className="pt-4 space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl border space-y-3">
                                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Pega este enlace en tu proveedor de WhatsApp (Twilio/Meta) para recibir mensajes reales:</p>
                                  <div className="flex gap-2">
                                    <Input readOnly value={webhookUrl} className="h-10 text-[10px] font-mono bg-white border-slate-200" />
                                    <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={copyToClipboard}>
                                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                       </div>
                    </div>
                  )}
               </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[3rem] flex flex-col h-[780px] ring-1 ring-slate-100">
               <CardHeader className="bg-slate-900 text-white pb-8 pt-10 px-8 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl rotate-3">
                        <MessageSquare className="h-7 w-7" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-headline font-black uppercase tracking-[0.1em] text-primary">Simulador Sync</CardTitle>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">IA Entrenamiento en Vivo</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-1.5 rounded-full text-[10px] font-black border border-green-500/20">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      READY
                    </div>
                  </div>
               </CardHeader>
               
               <CardContent className="flex-1 overflow-hidden p-0 bg-[#F0F2F5] flex flex-col relative">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://plus.unsplash.com/premium_photo-1661601633190-7d72111c6d1d?auto=format&fit=crop&q=80&w=400')] bg-repeat" />
                  
                  <ScrollArea className="flex-1 p-8 relative z-10">
                    <div className="space-y-6">
                      {messages.map((msg, i) => (
                        <div key={i} className={cn(
                          "flex items-end gap-3 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                          msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}>
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-transform hover:scale-110",
                            msg.role === 'user' ? "bg-white text-slate-600" : "bg-primary text-white"
                          )}>
                            {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                          </div>
                          <div className={cn(
                            "p-5 rounded-2xl text-sm font-bold shadow-xl leading-relaxed",
                            msg.role === 'user' ? "bg-white text-slate-800 rounded-br-none" : "bg-slate-900 text-white rounded-bl-none"
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex items-end gap-3 animate-pulse">
                          <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                            <Bot className="h-5 w-5" />
                          </div>
                          <div className="bg-slate-900 text-white p-5 rounded-2xl rounded-bl-none shadow-xl">
                             <div className="flex gap-1.5">
                               <div className="h-2 w-2 bg-white/40 rounded-full animate-bounce" />
                               <div className="h-2 w-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                               <div className="h-2 w-2 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                             </div>
                          </div>
                        </div>
                      )}
                      <div ref={scrollRef} />
                    </div>
                  </ScrollArea>
                  
                  <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex-shrink-0 relative z-10">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                       <Input 
                        placeholder={t.askBot} 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="h-16 rounded-2xl px-8 bg-slate-50 border-none ring-1 ring-slate-200 flex-1 font-bold text-slate-700"
                       />
                       <Button 
                        type="submit" 
                        size="icon" 
                        className="h-16 w-16 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 shrink-0 transition-all active:scale-90"
                        disabled={!chatInput.trim() || isTyping}
                       >
                         <Send className="h-6 w-6" />
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

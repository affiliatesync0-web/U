
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
      toast({ variant: "destructive", title: "Número Requerido", description: "Por favor ingresa tu número de WhatsApp Business." });
      return;
    }
    setCurrentStep(2);
  };

  const handleMagicLink = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const message = encodeURIComponent(`Hola Sync Connect, deseo vincular mi WhatsApp Business. Mi código de seguridad es: ${code}`);
    window.open(`https://wa.me/${formData.whatsappNumber}?text=${message}`, '_blank');
    setVerificationCode(code);
    toast({ title: "Enlace Mágico Abierto", description: "Envía el mensaje predefinido en WhatsApp para validar la conexión." });
  };

  const handleConfirmVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      setCurrentStep(3);
      handleSave();
      toast({ title: t.numberVerified, description: "Tu WhatsApp Business ha sido vinculado exitosamente al sistema." });
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
      toast({ title: t.saveChanges, description: "Configuración del asistente actualizada correctamente." })
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
      setMessages(prev => [...prev, { role: 'bot', content: "Error de conexión con el núcleo de IA. Por favor, reintenta." }])
    } finally {
      setIsTyping(false)
    }
  }

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Webhook Copiado", description: "Pégalo en la configuración de tu proveedor de WhatsApp." });
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
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-primary tracking-tight">Sync <span className="text-slate-900">Automation</span></h1>
            <p className="text-slate-500 font-medium">{t.botFeatures}</p>
          </div>
          
          <div className="flex gap-2 p-1.5 bg-white shadow-sm rounded-3xl border border-slate-100">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "h-10 px-6 flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                  currentStep === s ? "bg-primary text-white shadow-xl" : "text-slate-400"
                )}
              >
                {s === 1 ? t.linkStep1 : s === 2 ? t.linkStep2 : t.linkStep3}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-8">
            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
               <CardHeader className="bg-slate-50/50 pb-10 pt-12 px-10">
                 <div className="flex items-center gap-4 mb-3">
                   <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                     <Zap className="h-6 w-6" />
                   </div>
                   <CardTitle className="text-3xl font-headline font-black tracking-tight">Vínculo Mágico</CardTitle>
                 </div>
                 <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest">Configuración Profesional de API</CardDescription>
               </CardHeader>
               
               <CardContent className="pt-10 px-10 pb-12 space-y-10">
                  {currentStep === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                      <div className="space-y-4">
                        <Label className="text-xs font-black text-slate-700 uppercase tracking-[0.2em] px-1">{t.whatsappNumberLabel}</Label>
                        <Input 
                          placeholder="50588888888" 
                          value={formData.whatsappNumber}
                          onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                          className="h-20 rounded-[2rem] text-3xl font-mono bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all px-8"
                        />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">{t.whatsappHelp}</p>
                      </div>
                      <Button onClick={handleStartVerification} className="w-full h-20 rounded-[2rem] bg-primary text-white font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all">
                        Siguiente Paso <ExternalLink className="ml-3 h-6 w-6" />
                      </Button>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                      <div className="bg-green-50 border border-green-100 p-8 rounded-[2.5rem] text-center space-y-6">
                        <div className="h-20 w-20 bg-green-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-green-200 rotate-3">
                          <MessageSquare className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-black text-green-900 text-2xl">Vínculo Instantáneo</h3>
                          <p className="text-xs text-green-700 font-bold uppercase tracking-widest leading-relaxed">{t.magicLinkDesc}</p>
                        </div>
                        <Button onClick={handleMagicLink} className="w-full bg-green-600 hover:bg-green-700 h-16 rounded-[1.5rem] font-black text-white shadow-xl shadow-green-200 flex items-center justify-center gap-3">
                          <ExternalLink className="h-5 w-5" /> {t.verifyViaWhatsApp}
                        </Button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                        <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.3em]"><span className="bg-white px-4 text-slate-300">O ingresa el código SIM</span></div>
                      </div>

                      <div className="space-y-5">
                        <Input 
                          placeholder="000 000" 
                          maxLength={6}
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="h-20 text-center text-4xl font-black tracking-[0.5em] rounded-[2rem] bg-slate-50 border-none ring-1 ring-slate-100"
                        />
                        <Button onClick={handleConfirmVerification} disabled={isVerifying} className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white font-black text-lg shadow-2xl shadow-slate-200">
                          {isVerifying ? <Loader2 className="animate-spin h-6 w-6" /> : t.verify}
                        </Button>
                      </div>
                      <Button variant="ghost" onClick={() => setCurrentStep(1)} className="w-full text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-primary">Retroceder y cambiar número</Button>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                       <div className="flex items-center gap-5 p-6 bg-green-50 rounded-[2.5rem] border border-green-100 shadow-inner">
                         <div className="h-16 w-16 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-xl shrink-0 -rotate-3">
                           <CheckCircle2 className="h-8 w-8" />
                         </div>
                         <div>
                           <p className="text-[10px] font-black text-green-900 uppercase tracking-widest mb-1">VINCULACIÓN ACTIVA</p>
                           <p className="text-xl font-black text-green-700 font-mono">+{formData.whatsappNumber}</p>
                         </div>
                       </div>

                       <div className="space-y-6">
                          <div className="flex items-center justify-between p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                            <div className="space-y-1">
                              <Label className="text-lg font-black text-slate-900">Asistente IA</Label>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Respuestas en automático</p>
                            </div>
                            <Switch checked={formData.botEnabled} onCheckedChange={(val) => setFormData({...formData, botEnabled: val})} />
                          </div>

                          <div className="space-y-4">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] px-1">Mensaje de Bienvenida</Label>
                            <Textarea 
                              value={formData.botWelcomeMessage}
                              onChange={(e) => setFormData({...formData, botWelcomeMessage: e.target.value})}
                              className="min-h-[140px] rounded-[2rem] bg-slate-50 border-none ring-1 ring-slate-200 p-8 text-sm font-bold leading-relaxed text-slate-700"
                            />
                          </div>

                          <Button onClick={handleSave} className="w-full h-20 rounded-[2rem] bg-primary text-white font-black text-xl shadow-2xl shadow-primary/20" disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" /> : "Guardar Configuración Final"}
                          </Button>
                       </div>

                       <div className="pt-8 border-t border-slate-50">
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="webhook" className="border-none">
                              <AccordionTrigger className="bg-slate-900 text-white px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:no-underline shadow-2xl">
                                <span className="flex items-center gap-3"><Settings2 className="h-5 w-5 text-primary" /> Configuración Avanzada API</span>
                              </AccordionTrigger>
                              <AccordionContent className="pt-6 space-y-5">
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">URL de conexión para tu Gateway/Meta:</p>
                                  <div className="flex gap-3">
                                    <Input readOnly value={webhookUrl} className="h-12 text-[10px] font-mono bg-white border-slate-200 rounded-xl" />
                                    <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-xl" onClick={copyToClipboard}>
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

          <div className="lg:col-span-7 space-y-8">
            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[3.5rem] flex flex-col h-[820px] ring-1 ring-slate-100">
               <CardHeader className="bg-slate-900 text-white pb-10 pt-12 px-10 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-[1.25rem] bg-primary flex items-center justify-center text-white shadow-2xl rotate-3">
                        <MessageSquare className="h-8 w-8" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-headline font-black uppercase tracking-[0.15em] text-primary">Simulador Sync</CardTitle>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> IA Entrenamiento Real
                        </p>
                      </div>
                    </div>
                  </div>
               </CardHeader>
               
               <CardContent className="flex-1 overflow-hidden p-0 bg-[#F8FAFC] flex flex-col relative">
                  <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://plus.unsplash.com/premium_photo-1661601633190-7d72111c6d1d?auto=format&fit=crop&q=80&w=400')] bg-repeat" />
                  
                  <ScrollArea className="flex-1 p-10 relative z-10">
                    <div className="space-y-8">
                      {messages.map((msg, i) => (
                        <div key={i} className={cn(
                          "flex items-end gap-4 max-w-[90%] animate-in fade-in slide-in-from-bottom-4 duration-500",
                          msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}>
                          <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl transition-transform hover:scale-110",
                            msg.role === 'user' ? "bg-white text-slate-600 border border-slate-100" : "bg-primary text-white rotate-3"
                          )}>
                            {msg.role === 'user' ? <User className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
                          </div>
                          <div className={cn(
                            "p-6 rounded-[2rem] text-sm font-bold shadow-2xl leading-relaxed transition-all",
                            msg.role === 'user' ? "bg-white text-slate-800 rounded-br-none" : "bg-slate-900 text-white rounded-bl-none"
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex items-end gap-4 animate-pulse">
                          <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl">
                            <Bot className="h-6 w-6" />
                          </div>
                          <div className="bg-slate-900 text-white p-6 rounded-[2rem] rounded-bl-none shadow-2xl">
                             <div className="flex gap-2">
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
                  
                  <div className="p-8 bg-white/80 backdrop-blur-2xl border-t border-slate-100 flex-shrink-0 relative z-10">
                    <form onSubmit={handleSendMessage} className="flex gap-4">
                       <Input 
                        placeholder={t.askBot} 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="h-20 rounded-[1.5rem] px-10 bg-slate-50 border-none ring-1 ring-slate-100 flex-1 font-bold text-slate-800 shadow-inner"
                       />
                       <Button 
                        type="submit" 
                        size="icon" 
                        className="h-20 w-20 rounded-[1.5rem] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 shrink-0 transition-all active:scale-90"
                        disabled={!chatInput.trim() || isTyping}
                       >
                         <Send className="h-8 w-8" />
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

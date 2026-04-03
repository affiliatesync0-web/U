"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Bot, Send, CheckCircle2, Loader2, User, Copy, Check, Settings2, ExternalLink, Zap, MessageSquare, ShoppingBag, Target } from 'lucide-react'
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
  const [currentStep, setCurrentStep] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  const profileRef = useMemoFirebase(() => (user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);

  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);
  const { data: products } = useCollection(productsRef);

  const [formData, setFormData] = useState({
    whatsappNumber: '',
    botEnabled: false,
    botWelcomeMessage: '',
    targetProductId: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        whatsappNumber: profile.whatsappNumber || '',
        botEnabled: profile.botEnabled || false,
        botWelcomeMessage: profile.botWelcomeMessage || '¡Hola! Soy tu asistente de ventas. ¿Listo para adquirir nuestro mejor producto?',
        targetProductId: profile.targetProductId || ''
      })
      if (profile.whatsappNumber) setCurrentStep(3);
      if (messages.length === 0) {
        setMessages([{ role: 'bot', content: profile.botWelcomeMessage || '¡Hola! Soy tu bot de ventas configurado.' }])
      }
    }
  }, [profile])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSave = () => {
    if (!profileRef || !user) return
    setIsSaving(true)
    
    setDocumentNonBlocking(profileRef, {
      whatsappNumber: formData.whatsappNumber.replace(/\D/g, ''),
      botEnabled: formData.botEnabled,
      botWelcomeMessage: formData.botWelcomeMessage.trim(),
      targetProductId: formData.targetProductId,
      updatedAt: new Date().toISOString()
    }, { merge: true })

    setTimeout(() => {
      setIsSaving(false)
      toast({ title: t.saveChanges, description: "Tu Bot ha sido configurado con el producto seleccionado." })
    }, 1000)
  }

  const handleSimulateChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isTyping) return

    const selectedProduct = products?.find(p => p.id === formData.targetProductId);
    if (!selectedProduct) {
      toast({ variant: "destructive", title: "Error", description: "Elige un producto objetivo primero para que el bot sepa qué vender." });
      return;
    }

    const userMsg = chatInput.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatInput('')
    setIsTyping(true)

    try {
      const response = await processBotMessage({
        userMessage: userMsg,
        affiliateName: profile?.firstName || 'Asistente',
        welcomeMessage: formData.botWelcomeMessage,
        targetProduct: {
          name: selectedProduct.name,
          price: selectedProduct.price,
          code: selectedProduct.code,
          description: selectedProduct.description,
          bankName: selectedProduct.payoutBankId,
          accountNumber: selectedProduct.payoutBankAccountNumber,
          accountHolder: selectedProduct.payoutBankAccountHolderName
        },
        history: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          content: m.content
        }))
      })
      setMessages(prev => [...prev, { role: 'bot', content: response.reply }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', content: "Error en el simulador." }])
    } finally {
      setIsTyping(false)
    }
  }

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '';

  if (profileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
  }

  return (
    <DashboardShell role="affiliate">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-primary">Bot de <span className="text-slate-900">Ventas Automático</span></h1>
            <p className="text-slate-500 font-medium">Configura el cerebro de tu asistente para que venda por ti 24/7.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-8">
            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
               <CardHeader className="bg-slate-900 text-white p-10">
                 <div className="flex items-center gap-4">
                   <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                     <Target className="h-6 w-6" />
                   </div>
                   <CardTitle className="text-2xl font-headline font-black">Estrategia del Bot</CardTitle>
                 </div>
               </CardHeader>
               
               <CardContent className="p-10 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">1. ¿Qué producto debe vender el Bot?</Label>
                    <Select 
                      value={formData.targetProductId} 
                      onValueChange={(val) => setFormData({...formData, targetProductId: val})}
                    >
                      <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200">
                        <SelectValue placeholder="Selecciona un producto del catálogo" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="font-bold">
                            {p.name} - ${p.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">
                      El Bot usará los datos bancarios de este producto para cerrar la venta.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">2. Tu número de WhatsApp Business</Label>
                    <Input 
                      placeholder="50588888888" 
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                      className="h-16 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-mono text-xl px-6"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
                      <div className="space-y-1">
                        <Label className="font-black text-slate-900">Estado del Bot</Label>
                        <p className="text-[10px] text-slate-500 font-black uppercase">Activar para recibir mensajes</p>
                      </div>
                      <Switch checked={formData.botEnabled} onCheckedChange={(val) => setFormData({...formData, botEnabled: val})} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">3. Mensaje de Bienvenida</Label>
                    <Textarea 
                      value={formData.botWelcomeMessage}
                      onChange={(e) => setFormData({...formData, botWelcomeMessage: e.target.value})}
                      className="min-h-[120px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 p-6 text-sm font-bold"
                    />
                  </div>

                  <Button onClick={handleSave} className="w-full h-20 rounded-[2rem] bg-primary text-white font-black text-xl shadow-2xl shadow-primary/20" disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" /> : "Guardar y Lanzar Bot"}
                  </Button>

                  <div className="pt-6 border-t">
                    <Accordion type="single" collapsible>
                      <AccordionItem value="api" className="border-none">
                        <AccordionTrigger className="text-xs font-black uppercase text-slate-400">Configuración API Avanzada</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                           <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                             <p className="text-[9px] font-black text-slate-400 uppercase">Webhook URL (Meta/Gateway)</p>
                             <div className="flex gap-2">
                               <Input readOnly value={webhookUrl} className="h-10 text-[10px] bg-white" />
                               <Button size="icon" variant="outline" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast({ title: "Copiado" }) }}><Copy className="h-4 w-4" /></Button>
                             </div>
                           </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
               </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[3.5rem] flex flex-col h-[850px] ring-1 ring-slate-100">
               <CardHeader className="bg-slate-900 text-white p-10">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl rotate-3">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-headline font-black text-primary">Simulador del Bot</CardTitle>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Prueba cómo vende tu Bot el producto seleccionado</p>
                    </div>
                  </div>
               </CardHeader>
               
               <CardContent className="flex-1 overflow-hidden p-0 bg-[#F8FAFC] flex flex-col">
                  <ScrollArea className="flex-1 p-10">
                    <div className="space-y-8">
                      {messages.map((msg, i) => (
                        <div key={i} className={cn(
                          "flex items-end gap-4 max-w-[85%] animate-in fade-in slide-in-from-bottom-2",
                          msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}>
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
                            msg.role === 'user' ? "bg-white text-slate-400 border" : "bg-primary text-white rotate-3"
                          )}>
                            {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                          </div>
                          <div className={cn(
                            "p-6 rounded-[2rem] text-sm font-bold shadow-sm leading-relaxed",
                            msg.role === 'user' ? "bg-white text-slate-800 rounded-br-none" : "bg-slate-900 text-white rounded-bl-none"
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex items-end gap-4 animate-pulse">
                          <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-xl"><Bot className="h-5 w-5" /></div>
                          <div className="bg-slate-900 text-white p-6 rounded-[2rem] rounded-bl-none shadow-sm w-24">
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
                  
                  <div className="p-8 bg-white border-t border-slate-100">
                    <form onSubmit={handleSimulateChat} className="flex gap-4">
                       <Input 
                        placeholder="Escribe como si fueras un cliente..." 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="h-16 rounded-2xl px-8 bg-slate-50 border-none ring-1 ring-slate-100 flex-1 font-bold text-slate-800"
                       />
                       <Button 
                        type="submit" 
                        size="icon" 
                        className="h-16 w-16 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 shrink-0"
                        disabled={!chatInput.trim() || isTyping || !formData.targetProductId}
                       >
                         <Send className="h-6 w-6" />
                       </Button>
                    </form>
                    {!formData.targetProductId && (
                      <p className="text-[10px] text-red-500 font-bold uppercase mt-3 text-center">⚠️ Debes seleccionar un producto arriba para simular la venta.</p>
                    )}
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

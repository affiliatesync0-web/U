
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
import { Bot, Send, CheckCircle2, Loader2, User, Copy, Check, Settings2, ExternalLink, Zap, MessageSquare, ShoppingBag, Target, Sparkles } from 'lucide-react'
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
        botWelcomeMessage: profile.botWelcomeMessage || '¡Hola! Soy tu asistente de ventas experto. ¿Listo para escalar tus resultados con nuestro mejor producto?',
        targetProductId: profile.targetProductId || ''
      })
      if (messages.length === 0) {
        setMessages([{ role: 'bot', content: profile.botWelcomeMessage || '¡Hola! Soy tu bot de ventas. Elige un producto arriba y dime "Hola" para probar cómo lo vendo.' }])
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
      toast({ title: "Configuración Aplicada", description: "Tu Bot de Ventas ahora está especializado en el producto seleccionado." })
    }, 1000)
  }

  const handleSimulateChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isTyping) return

    const selectedProduct = products?.find(p => p.id === formData.targetProductId);
    if (!selectedProduct) {
      toast({ variant: "destructive", title: "Producto no seleccionado", description: "Selecciona el producto que el bot debe vender antes de simular." });
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
      setMessages(prev => [...prev, { role: 'bot', content: "Error al conectar con el cerebro de IA." }])
    } finally {
      setIsTyping(false)
    }
  }

  if (profileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
  }

  return (
    <DashboardShell role="affiliate">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-primary uppercase italic tracking-tighter">Asistente de <span className="text-slate-900">Ventas IA</span></h1>
            <p className="text-slate-500 font-medium">Configura el bot que cerrará tus ventas por WhatsApp automáticamente.</p>
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
                   <CardTitle className="text-2xl font-headline font-black">Especialización</CardTitle>
                 </div>
               </CardHeader>
               
               <CardContent className="p-10 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Producto que el Bot debe vender</Label>
                    <Select 
                      value={formData.targetProductId} 
                      onValueChange={(val) => setFormData({...formData, targetProductId: val})}
                    >
                      <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold">
                        <SelectValue placeholder="Selecciona del catálogo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="font-bold">
                            {p.name} (USD {p.price})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tu número de WhatsApp (Sin +)</Label>
                    <Input 
                      placeholder="50588888888" 
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                      className="h-16 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-mono text-xl px-6"
                    />
                  </div>

                  <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-900">Estado del Bot</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Activar para responder clientes</p>
                    </div>
                    <Switch checked={formData.botEnabled} onCheckedChange={(v) => setFormData({...formData, botEnabled: v})} />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mensaje de Saludo</Label>
                    <Textarea 
                      value={formData.botWelcomeMessage}
                      onChange={(e) => setFormData({...formData, botWelcomeMessage: e.target.value})}
                      className="min-h-[100px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 p-6 text-sm font-bold"
                    />
                  </div>

                  <Button onClick={handleSave} className="w-full h-20 rounded-[2.5rem] bg-primary text-white font-black text-xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all" disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" /> : <><Zap className="mr-2 h-6 w-6" /> GUARDAR E INICIAR BOT</>}
                  </Button>
               </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[3.5rem] flex flex-col h-[800px] ring-1 ring-slate-100">
               <CardHeader className="bg-slate-900 text-white p-10">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl rotate-3">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-headline font-black text-primary">Simulador IA</CardTitle>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Prueba la capacidad de cierre de tu bot</p>
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
                            msg.role === 'user' ? "bg-white text-slate-400 border" : "bg-slate-900 text-white rotate-3"
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
                        placeholder="Escribe como si fueras un cliente interesado..." 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="h-16 rounded-2xl px-8 bg-slate-50 border-none ring-1 ring-slate-100 flex-1 font-bold text-slate-800"
                       />
                       <Button 
                        type="submit" 
                        size="icon" 
                        className="h-16 w-16 rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 shrink-0"
                        disabled={!chatInput.trim() || isTyping || !formData.targetProductId}
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

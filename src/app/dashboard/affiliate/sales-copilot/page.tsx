"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  Smartphone,
  Copy,
  Search,
  Users2,
  CheckCircle2,
  Settings,
  X,
  Layout,
  Check,
  ExternalLink,
  Zap,
  MousePointer2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase'
import { doc, collection, query, where } from 'firebase/firestore'
import { processAssistantMessage } from '@/ai/flows/sales-assistant-flow'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ChatMessage {
  role: 'user' | 'bot'
  content: string
}

export default function SalesCopilotPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', content: '¡Hola! Soy tu Copiloto de Ventas. ¿Tienes algún cliente difícil o necesitas un script persuasivo para algún producto? Estoy listo para ayudarte a cerrar tratos.' }
  ])
  const [input, setInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [searchBuyer, setSearchBuyer] = useState('')
  const [copiedIndex, setCopiedId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null)

  const profileRef = useMemoFirebase(() => (user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(profileRef);

  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: products } = useCollection(productsRef);

  const buyersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'buyers'), where('referredBy', '==', user.uid));
  }, [db, user]);
  
  const { data: buyers, isLoading: buyersLoading } = useCollection(buyersQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isAiLoading])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isAiLoading) return

    const userMsg = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setIsAiLoading(true)

    try {
      const response = await processAssistantMessage({
        userMessage: userMsg,
        affiliateName: profile?.firstName || 'Afiliado',
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
      setMessages(prev => [...prev, { role: 'bot', content: "Hubo un error al conectar con mis neuronas de venta. ¿Podrías repetir?" }])
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleCopyScript = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Script Copiado", description: "Pégalo en tu chat de WhatsApp." });
  };

  const openWhatsApp = (phoneNumber: string = '', message: string = '') => {
    if (!phoneNumber) {
      window.open('https://web.whatsapp.com', '_blank');
      return;
    }
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast({ title: "Abriendo WhatsApp", description: "Conectando con el prospecto..." });
  };

  return (
    <DashboardShell role="affiliate">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
        
        {/* CABECERA ESTRATÉGICA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Zap className="h-8 w-8 fill-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-headline font-black text-slate-900 tracking-tight">Sales Command <span className="text-primary">Center</span></h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Sincronizado con IA & WhatsApp
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => openWhatsApp()} variant="outline" className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-200 hover:bg-slate-50 gap-2">
              <ExternalLink className="h-4 w-4" /> Abrir WhatsApp Web
            </Button>
            <div className="h-12 px-6 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-green-600" />
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">+{profile?.whatsappNumber || 'Sin vincular'}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
          
          {/* LADO IZQUIERDO: DIRECTORIO DE PROSPECTOS */}
          <div className="w-full lg:w-[350px] flex flex-col h-full overflow-hidden">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col h-full ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-6 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-headline font-black tracking-tight text-white flex items-center gap-2">
                    <Users2 className="h-5 w-5 text-primary" /> Mis Prospectos
                  </h3>
                  <BadgeDollarSign className="h-5 w-5 text-primary opacity-50" />
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    placeholder="Buscar por nombre o número..." 
                    value={searchBuyer}
                    onChange={(e) => setSearchBuyer(e.target.value)}
                    className="bg-white/5 border-none ring-1 ring-white/10 text-white h-11 pl-11 rounded-xl text-xs font-medium focus:ring-primary placeholder:text-slate-600"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/50">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    {buyersLoading ? (
                      <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20" /></div>
                    ) : !buyers || buyers.length === 0 ? (
                      <div className="text-center py-24 opacity-20 space-y-4">
                        <Users2 className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Lista vacía</p>
                      </div>
                    ) : (
                      buyers
                        .filter(b => 
                          b.firstName?.toLowerCase().includes(searchBuyer.toLowerCase()) || 
                          b.phone?.includes(searchBuyer)
                        )
                        .map((buyer) => (
                        <div key={buyer.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                                {buyer.firstName?.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-black text-slate-800 truncate">{buyer.firstName}</h4>
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-tight">
                                  {buyer.phone || 'Sin número'}
                                </p>
                              </div>
                            </div>
                            <CheckCircle2 className={cn("h-3 w-3", buyer.phone ? "text-green-500" : "text-slate-200")} />
                          </div>
                          <Button 
                            onClick={() => {
                              setInput(`Genera un script de seguimiento para ${buyer.firstName} que mostró interés en nuestros productos.`);
                              openWhatsApp(buyer.phone, `¡Hola ${buyer.firstName}! Soy ${profile?.firstName} de Sync Connect...`);
                            }}
                            disabled={!buyer.phone}
                            className="w-full h-9 rounded-lg bg-green-600 hover:bg-green-700 text-white font-black text-[9px] uppercase tracking-widest gap-2 shadow-sm transition-all"
                          >
                            <MessageSquare className="h-3 w-3" /> Chatear
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* PANEL CENTRAL: COPILOTO IA ESTRATÉGICO */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[3rem] flex flex-col h-full ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-6 shrink-0 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-2xl rotate-3">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-headline font-black tracking-tight flex items-center gap-2 text-primary">
                        Sales Copilot AI <Sparkles className="h-3 w-3 fill-primary" />
                      </CardTitle>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Mentor de Ventas Digitales</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setMessages([{ role: 'bot', content: 'Chat reiniciado. ¿En qué venta te ayudo ahora?' }])} className="text-white/40 hover:text-white h-8 px-3 rounded-lg text-[9px] uppercase font-black tracking-widest">
                      Limpiar
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0 bg-[#F8FAFC] flex flex-col relative">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://plus.unsplash.com/premium_photo-1661601633190-7d72111c6d1d?auto=format&fit=crop&q=80&w=400')] bg-repeat" />
                
                <ScrollArea className="flex-1 p-6 relative z-10">
                  <div className="space-y-6 max-w-3xl mx-auto">
                    {messages.map((msg, i) => (
                      <div key={i} className={cn(
                        "flex items-end gap-3 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-500",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                      )}>
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg transition-all",
                          msg.role === 'user' ? "bg-white text-slate-600 border border-slate-100" : "bg-primary text-white rotate-3"
                        )}>
                          {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className="space-y-2 group">
                          <div className={cn(
                            "p-5 rounded-2xl text-xs font-bold shadow-sm leading-relaxed whitespace-pre-wrap transition-all",
                            msg.role === 'user' ? "bg-white text-slate-800 rounded-br-none border border-slate-100" : "bg-slate-900 text-white rounded-bl-none"
                          )}>
                            {msg.content}
                          </div>
                          {msg.role === 'bot' && i !== 0 && (
                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-[8px] font-black uppercase text-primary tracking-widest gap-2 bg-white/80 backdrop-blur rounded-full px-3 h-7 shadow-sm border border-primary/10"
                                onClick={() => handleCopyScript(msg.content, i)}
                              >
                                {copiedIndex === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                {copiedIndex === i ? "Copiado" : "Copiar Script"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isAiLoading && (
                      <div className="flex items-end gap-3 animate-pulse">
                        <div className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-slate-900 text-white p-5 rounded-2xl rounded-bl-none shadow-sm min-w-[80px]">
                           <div className="flex gap-1.5">
                             <div className="h-1 w-1 bg-white/40 rounded-full animate-bounce" />
                             <div className="h-1 w-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                             <div className="h-1 w-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                           </div>
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 shrink-0 relative z-10">
                  <div className="max-w-3xl mx-auto flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Manejo de Objeciones", text: "Ayúdame a responder a un cliente que dice que no tiene dinero ahora." },
                        { label: "Script de Cierre", text: "Dame un mensaje matador para cerrar la venta de un curso premium." },
                        { label: "Bienvenida", text: "Redacta un mensaje de bienvenida cálido y persuasivo para un nuevo lead." }
                      ].map((btn) => (
                        <button 
                          key={btn.label}
                          onClick={() => setInput(btn.text)}
                          className="h-7 rounded-full px-3 text-[7px] font-black uppercase border border-slate-200 text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                      <Input 
                        placeholder="Pregunta a tu mentor de ventas..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="h-12 rounded-xl px-6 bg-slate-50 border-none ring-1 ring-slate-200 flex-1 font-bold text-slate-800 shadow-inner focus:ring-4 focus:ring-primary/10 transition-all text-xs"
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 shrink-0 transition-all active:scale-90"
                        disabled={!input.trim() || isAiLoading}
                      >
                        <Send className="h-5 w-5 text-white" />
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LADO DERECHO: HERRAMIENTAS DE TRABAJO */}
          <div className="hidden xl:flex w-[280px] flex-col gap-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-slate-100">
              <CardHeader className="bg-green-600 text-white p-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <MousePointer2 className="h-4 w-4" /> Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Flujo de Trabajo</p>
                  <ol className="space-y-3">
                    <li className="flex gap-3 text-[10px] font-bold text-slate-600">
                      <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-black">1</span>
                      Elige un prospecto a la izquierda.
                    </li>
                    <li className="flex gap-3 text-[10px] font-bold text-slate-600">
                      <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-black">2</span>
                      Pide a la IA un script persuasivo.
                    </li>
                    <li className="flex gap-3 text-[10px] font-bold text-slate-600">
                      <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 font-black">3</span>
                      Copia el script y pégalo en WhatsApp.
                    </li>
                  </ol>
                </div>
                
                <div className="space-y-3">
                  <Button onClick={() => openWhatsApp()} className="w-full bg-slate-900 hover:bg-black text-white h-12 rounded-xl font-black text-[10px] uppercase tracking-widest">
                    Lanzar WhatsApp Web
                  </Button>
                  <p className="text-[8px] text-slate-400 text-center font-bold px-2 italic">
                    Tip: Coloca la ventana de WhatsApp al lado de esta pestaña para vender más rápido.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden ring-1 ring-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-xl">
                  <Layout className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest">Vista Multitarea</h4>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Sync Connect está diseñado para ser tu escritorio de ventas. No necesitas cerrar nada, solo copiar, pegar y cerrar ventas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  ExternalLink, 
  ShoppingBag, 
  Sparkles, 
  Target, 
  Zap, 
  Smartphone,
  Copy,
  Check,
  Search,
  Users2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase'
import { doc, collection } from 'firebase/firestore'
import { processAssistantMessage } from '@/ai/flows/sales-assistant-flow'
import { cn } from '@/lib/utils'

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
    { role: 'bot', content: '¡Hola! Soy tu Copiloto de Ventas. ¿Tienes algún cliente difícil o necesitas un script persuasivo para algún producto?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchBuyer, setSearchBuyer] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const profileRef = useMemoFirebase(() => (user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(profileRef);

  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: products } = useCollection(productsRef);

  const buyersRef = useMemoFirebase(() => collection(db, 'buyers'), [db]);
  const { data: buyers } = useCollection(buyersRef);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setIsLoading(true)

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
      setIsLoading(false)
    }
  }

  const openWhatsAppChat = (phoneNumber: string = '', message: string = '') => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <DashboardShell role="affiliate">
      <div className="h-[calc(100vh-180px)] flex flex-col lg:flex-row gap-6">
        
        {/* LADO IZQUIERDO: CENTRO DE CONTACTO */}
        <div className="w-full lg:w-[450px] flex flex-col gap-6 h-full overflow-hidden">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col h-full ring-1 ring-slate-100">
            <CardHeader className="bg-slate-900 text-white p-8 space-y-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-2xl rotate-3">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="px-4 py-1.5 bg-green-500/20 text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                  Panel WhatsApp
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-headline font-black tracking-tight">Mis Prospectos</CardTitle>
                <CardDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Gestión de contactos directos</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="Buscar cliente..." 
                  value={searchBuyer}
                  onChange={(e) => setSearchBuyer(e.target.value)}
                  className="bg-white/5 border-none ring-1 ring-white/10 text-white h-12 pl-11 rounded-xl text-sm font-medium focus:ring-primary"
                />
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-4">
                  {!buyers || buyers.length === 0 ? (
                    <div className="text-center py-20 opacity-20 space-y-4">
                      <Users2 className="h-12 w-12 mx-auto" />
                      <p className="text-xs font-black uppercase tracking-widest">Sin prospectos registrados</p>
                    </div>
                  ) : (
                    buyers
                      .filter(b => b.firstName?.toLowerCase().includes(searchBuyer.toLowerCase()) || b.email?.toLowerCase().includes(searchBuyer.toLowerCase()))
                      .map((buyer) => (
                      <div key={buyer.id} className="p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 group hover:bg-primary/5 hover:border-primary/10 transition-all">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-slate-400 font-black shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                              {buyer.firstName?.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-800 tracking-tight">{buyer.firstName} {buyer.lastName}</h4>
                              <p className="text-[10px] text-slate-400 font-bold tracking-tight uppercase">{buyer.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => openWhatsAppChat('', `¡Hola ${buyer.firstName}! Soy ${profile?.firstName} de Sync Connect. Me gustaría darte seguimiento sobre tu interés en nuestros productos...`)}
                            className="flex-1 h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-[9px] uppercase tracking-widest gap-2 shadow-lg shadow-green-200"
                          >
                            <MessageSquare className="h-3 w-3" /> Contactar
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(buyer.email);
                              toast({ title: "Email Copiado" });
                            }}
                            className="h-10 w-10 rounded-xl border-slate-200 text-slate-400 hover:text-primary transition-all"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <Button asChild variant="ghost" className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-primary">
                <a href="https://web.whatsapp.com" target="_blank" rel="noopener noreferrer">
                  Abrir WhatsApp Web <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </div>
          </Card>
        </div>

        {/* LADO DERECHO: COPILOTO IA */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[3rem] flex flex-col h-full ring-1 ring-slate-100">
            <CardHeader className="bg-slate-900 text-white p-8 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl rotate-3">
                    <Bot className="h-7 w-7" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-headline font-black tracking-tight flex items-center gap-2">
                      Sales Copilot <Sparkles className="h-4 w-4 text-primary fill-primary" />
                    </CardTitle>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> IA Entrenamiento Real
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Catálogo Vinculado</span>
                  <span className="text-xs font-bold text-primary">{products?.length || 0} Productos Activos</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 bg-[#F8FAFC] flex flex-col relative">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://plus.unsplash.com/premium_photo-1661601633190-7d72111c6d1d?auto=format&fit=crop&q=80&w=400')] bg-repeat" />
              
              <ScrollArea className="flex-1 p-8 relative z-10">
                <div className="space-y-8 max-w-4xl mx-auto">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn(
                      "flex items-end gap-4 max-w-[85%] animate-in fade-in slide-in-from-bottom-4 duration-500",
                      msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}>
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
                        msg.role === 'user' ? "bg-white text-slate-600" : "bg-primary text-white rotate-3"
                      )}>
                        {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                      </div>
                      <div className={cn(
                        "p-6 rounded-[2rem] text-sm font-bold shadow-sm leading-relaxed whitespace-pre-wrap",
                        msg.role === 'user' ? "bg-white text-slate-800 rounded-br-none border border-slate-100" : "bg-slate-900 text-white rounded-bl-none"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-end gap-4 animate-pulse">
                      <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="bg-slate-900 text-white p-6 rounded-[2rem] rounded-bl-none shadow-sm">
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

              <div className="p-8 bg-white border-t border-slate-100 shrink-0 relative z-10">
                <div className="max-w-4xl mx-auto flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setInput("Necesito un script para convencer a alguien que dice que está caro.")}
                      className="h-8 rounded-full text-[9px] font-black uppercase border-slate-100 text-slate-400 hover:text-primary hover:border-primary transition-all"
                    >
                      Manejo de Precio
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setInput("¿Cómo puedo ofrecer el catálogo de forma natural?")}
                      className="h-8 rounded-full text-[9px] font-black uppercase border-slate-100 text-slate-400 hover:text-primary hover:border-primary transition-all"
                    >
                      Apertura de Venta
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setInput("Genera un copy persuasivo para Instagram Ads.")}
                      className="h-8 rounded-full text-[9px] font-black uppercase border-slate-100 text-slate-400 hover:text-primary hover:border-primary transition-all"
                    >
                      Generar Copy
                    </Button>
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-4">
                    <Input 
                      placeholder="Pregúntale a tu copiloto... (Ej: 'Redacta un mensaje de seguimiento')" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="h-16 rounded-2xl px-8 bg-slate-50 border-none ring-1 ring-slate-100 flex-1 font-bold text-slate-800 shadow-inner focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="h-16 w-16 rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 shrink-0 transition-all active:scale-90"
                      disabled={!input.trim() || isLoading}
                    >
                      <Send className="h-6 w-6" />
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

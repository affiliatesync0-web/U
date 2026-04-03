"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
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
  ExternalLink, 
  Sparkles, 
  Smartphone,
  Copy,
  Search,
  Users2,
  Phone,
  CheckCircle2,
  Settings
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
    { role: 'bot', content: '¡Hola! Soy tu Copiloto de Ventas. ¿Tienes algún cliente difícil o necesitas un script persuasivo para algún producto?' }
  ])
  const [input, setInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [searchBuyer, setSearchBuyer] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const profileRef = useMemoFirebase(() => (user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(profileRef);

  const productsRef = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: products } = useCollection(productsRef);

  // Filtrar prospectos por el ID del afiliado actual
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

  const openWhatsAppChat = (phoneNumber: string = '', message: string = '') => {
    if (!phoneNumber) {
      toast({ variant: "destructive", title: "Sin número", description: "Este prospecto no tiene un número de teléfono registrado." });
      return;
    }
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
            <CardHeader className="bg-slate-900 text-white p-8 space-y-6 shrink-0">
              {/* Profile Context */}
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10">
                <Avatar className="h-14 w-14 border-4 border-primary/20 shadow-2xl">
                  <AvatarImage src={profile?.photoUrl} className="object-cover" />
                  <AvatarFallback className="bg-primary text-white font-black">{profile?.firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-0.5">Operador Sync</p>
                  <h3 className="text-base font-black truncate">{profile?.firstName} {profile?.lastName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">
                      {profile?.whatsappNumber ? `+${profile.whatsappNumber}` : 'WhatsApp no vinculado'}
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/affiliate/bot-settings">
                  <Button size="icon" variant="ghost" className="text-white/40 hover:text-primary transition-colors">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-headline font-black tracking-tight">Mis Prospectos</CardTitle>
                    <CardDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Cartera de clientes vinculados</CardDescription>
                  </div>
                  <Smartphone className="h-6 w-6 text-primary opacity-50" />
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    placeholder="Buscar por nombre o número..." 
                    value={searchBuyer}
                    onChange={(e) => setSearchBuyer(e.target.value)}
                    className="bg-white/5 border-none ring-1 ring-white/10 text-white h-12 pl-11 rounded-xl text-sm font-medium focus:ring-primary placeholder:text-slate-600"
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/50">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-4">
                  {buyersLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20" /></div>
                  ) : !buyers || buyers.length === 0 ? (
                    <div className="text-center py-24 opacity-20 space-y-4">
                      <div className="h-20 w-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users2 className="h-10 w-10" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest">Sin prospectos registrados</p>
                      <p className="text-[10px] max-w-[200px] mx-auto leading-relaxed">Usa tu link de divulgación para que tus clientes aparezcan en esta lista.</p>
                    </div>
                  ) : (
                    buyers
                      .filter(b => 
                        b.firstName?.toLowerCase().includes(searchBuyer.toLowerCase()) || 
                        b.email?.toLowerCase().includes(searchBuyer.toLowerCase()) ||
                        b.phone?.includes(searchBuyer)
                      )
                      .map((buyer) => (
                      <div key={buyer.id} className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm group hover:shadow-xl hover:ring-2 hover:ring-primary/5 transition-all duration-500">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                              {buyer.firstName?.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-base font-black text-slate-800 tracking-tight">{buyer.firstName} {buyer.lastName}</h4>
                              <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <p className="text-[10px] text-slate-400 font-black tracking-tight uppercase">
                                  {buyer.phone || 'Sin número'}
                                </p>
                              </div>
                            </div>
                          </div>
                          {buyer.phone && (
                            <div className="h-8 w-8 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-100">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => openWhatsAppChat(buyer.phone, `¡Hola ${buyer.firstName}! Soy ${profile?.firstName} de Sync Connect. Te contacto para darte seguimiento...`)}
                            disabled={!buyer.phone}
                            className="flex-1 h-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-green-200 transition-all hover:scale-[1.02]"
                          >
                            <MessageSquare className="h-4 w-4" /> Contactar Ahora
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(buyer.email);
                              toast({ title: "Email Copiado" });
                            }}
                            className="h-12 w-12 rounded-2xl border-slate-100 text-slate-400 hover:text-primary transition-all shadow-sm"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            
            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
              <Button asChild variant="default" className="w-full h-14 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:bg-primary transition-all">
                <a href="https://web.whatsapp.com" target="_blank" rel="noopener noreferrer">
                  Abrir mi Panel WhatsApp <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </Card>
        </div>

        {/* LADO DERECHO: COPILOTO IA */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[3rem] flex flex-col h-full ring-1 ring-slate-100">
            <CardHeader className="bg-slate-900 text-white p-8 shrink-0 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-primary flex items-center justify-center text-white shadow-2xl rotate-3 ring-4 ring-primary/20">
                    <Bot className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-headline font-black tracking-tight flex items-center gap-3">
                      Sales Copilot <Sparkles className="h-5 w-5 text-primary fill-primary" />
                    </CardTitle>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Inteligencia de Cierre Real
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Catálogo Sync</span>
                  <span className="text-sm font-black text-primary">{products?.length || 0} Soluciones</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 bg-[#F8FAFC] flex flex-col relative">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://plus.unsplash.com/premium_photo-1661601633190-7d72111c6d1d?auto=format&fit=crop&q=80&w=400')] bg-repeat" />
              
              <ScrollArea className="flex-1 p-10 relative z-10">
                <div className="space-y-8 max-w-4xl mx-auto">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn(
                      "flex items-end gap-5 max-w-[85%] animate-in fade-in slide-in-from-bottom-4 duration-700",
                      msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}>
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl transition-all hover:scale-110",
                        msg.role === 'user' ? "bg-white text-slate-600 ring-1 ring-slate-100" : "bg-primary text-white rotate-3"
                      )}>
                        {msg.role === 'user' ? <User className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
                      </div>
                      <div className={cn(
                        "p-8 rounded-[2.5rem] text-sm font-bold shadow-sm leading-relaxed whitespace-pre-wrap transition-all",
                        msg.role === 'user' ? "bg-white text-slate-800 rounded-br-none" : "bg-slate-900 text-white rounded-bl-none"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex items-end gap-5 animate-pulse">
                      <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl">
                        <Bot className="h-6 w-6" />
                      </div>
                      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] rounded-bl-none shadow-sm min-w-[120px]">
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

              <div className="p-10 bg-white/80 backdrop-blur-2xl border-t border-slate-100 shrink-0 relative z-10">
                <div className="max-w-4xl mx-auto flex flex-col gap-6">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Manejo de Precio", text: "Genera un script persuasivo para un cliente que dice que el producto está caro." },
                      { label: "Seguimiento", text: "Redacta un mensaje de WhatsApp para dar seguimiento a un prospecto que no respondió hace 2 días." },
                      { label: "Copy para Ads", text: "Necesito un copy corto y matador para vender este catálogo en Instagram Stories." }
                    ].map((btn) => (
                      <Button 
                        key={btn.label}
                        variant="outline" 
                        onClick={() => setInput(btn.text)}
                        className="h-10 rounded-full px-6 text-[10px] font-black uppercase border-slate-100 text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"
                      >
                        {btn.label}
                      </Button>
                    ))}
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-4">
                    <Input 
                      placeholder="Escribe tu consulta de ventas... (Ej: '¿Cómo convenzo a un prospecto indeciso?')" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="h-20 rounded-[1.5rem] px-10 bg-slate-50 border-none ring-1 ring-slate-100 flex-1 font-bold text-slate-800 shadow-inner focus:ring-4 focus:ring-primary/10 transition-all text-base"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="h-20 w-20 rounded-[1.5rem] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 shrink-0 transition-all active:scale-90"
                      disabled={!input.trim() || isAiLoading}
                    >
                      <Send className="h-8 w-8" />
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

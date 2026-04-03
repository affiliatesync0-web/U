
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
  CheckCircle2,
  Settings,
  X,
  Layout,
  Check
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

type ViewMode = 'ai' | 'whatsapp'

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
  const [viewMode, setViewMode] = useState<ViewMode>('ai')
  const [whatsappUrl, setWhatsappUrl] = useState('https://web.whatsapp.com')
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

  const activateWhatsAppView = (phoneNumber: string = '', message: string = '') => {
    let url = 'https://web.whatsapp.com';
    if (phoneNumber) {
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      url = `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
    }
    setWhatsappUrl(url);
    setViewMode('whatsapp');
    toast({ title: "Cargando WhatsApp", description: "Conectando con tu mesa de trabajo..." });
  };

  return (
    <DashboardShell role="affiliate">
      <div className="h-[calc(100vh-180px)] flex flex-col lg:flex-row gap-6">
        
        {/* LADO IZQUIERDO: CENTRO DE CONTACTO */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 h-full overflow-hidden">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col h-full ring-1 ring-slate-100">
            <CardHeader className="bg-slate-900 text-white p-8 space-y-6 shrink-0">
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
                      {profile?.whatsappNumber ? `+${profile.whatsappNumber}` : 'Sin WhatsApp'}
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
                  <h3 className="text-xl font-headline font-black tracking-tight text-white">Mis Prospectos</h3>
                  <Smartphone className="h-5 w-5 text-primary opacity-50" />
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    placeholder="Buscar cliente..." 
                    value={searchBuyer}
                    onChange={(e) => setSearchBuyer(e.target.value)}
                    className="bg-white/5 border-none ring-1 ring-white/10 text-white h-12 pl-11 rounded-xl text-xs font-medium focus:ring-primary placeholder:text-slate-600"
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
                      <div className="h-16 w-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users2 className="h-8 w-8" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Sin prospectos</p>
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
                            <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                              {buyer.firstName?.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-800 tracking-tight">{buyer.firstName}</h4>
                              <p className="text-[9px] text-slate-400 font-black tracking-tight uppercase">
                                {buyer.phone || 'Sin número'}
                              </p>
                            </div>
                          </div>
                          {buyer.phone && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => activateWhatsAppView(buyer.phone, `¡Hola ${buyer.firstName}! Soy ${profile?.firstName} de Sync Connect. Te contacto para darte seguimiento...`)}
                            disabled={!buyer.phone}
                            className="flex-1 h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-[9px] uppercase tracking-widest gap-2 shadow-xl shadow-green-200 transition-all"
                          >
                            <MessageSquare className="h-3 w-3" /> Contactar
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(buyer.email);
                              toast({ title: "Email Copiado" });
                            }}
                            className="h-10 w-10 rounded-xl border-slate-100 text-slate-400 hover:text-primary transition-all"
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
            
            <div className="p-6 bg-white border-t border-slate-100 shrink-0">
              <Button onClick={() => activateWhatsAppView()} variant="default" className="w-full h-12 bg-slate-900 text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl shadow-2xl hover:bg-primary transition-all">
                Abrir Panel WhatsApp <Layout className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </Card>
        </div>

        {/* LADO DERECHO: VISTA DINÁMICA (IA O WHATSAPP) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[3rem] flex flex-col h-full ring-1 ring-slate-100">
            <CardHeader className="bg-slate-900 text-white p-8 shrink-0 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "h-14 w-14 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl rotate-3 ring-4 transition-all",
                    viewMode === 'ai' ? "bg-primary ring-primary/20" : "bg-green-500 ring-green-500/20"
                  )}>
                    {viewMode === 'ai' ? <Bot className="h-7 w-7" /> : <MessageSquare className="h-7 w-7" />}
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-headline font-black tracking-tight flex items-center gap-3">
                      {viewMode === 'ai' ? "Sales Copilot" : "WhatsApp Web"} 
                      {viewMode === 'ai' && <Sparkles className="h-4 w-4 text-primary fill-primary" />}
                    </CardTitle>
                    <div className="flex gap-4 mt-1">
                      <button 
                        onClick={() => setViewMode('ai')}
                        className={cn(
                          "text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-opacity",
                          viewMode === 'ai' ? "text-primary" : "text-slate-500 opacity-50 hover:opacity-100"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", viewMode === 'ai' ? "bg-primary animate-pulse" : "bg-slate-700")} /> Asistente IA
                      </button>
                      <button 
                        onClick={() => setViewMode('whatsapp')}
                        className={cn(
                          "text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 transition-opacity",
                          viewMode === 'whatsapp' ? "text-green-500" : "text-slate-500 opacity-50 hover:opacity-100"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", viewMode === 'whatsapp' ? "bg-green-500 animate-pulse" : "bg-slate-700")} /> WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
                
                {viewMode === 'whatsapp' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setViewMode('ai')}
                    className="text-white/40 hover:text-white gap-2"
                  >
                    <X className="h-4 w-4" /> Cerrar WhatsApp
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 bg-[#F8FAFC] flex flex-col relative">
              {viewMode === 'ai' ? (
                <>
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://plus.unsplash.com/premium_photo-1661601633190-7d72111c6d1d?auto=format&fit=crop&q=80&w=400')] bg-repeat" />
                  
                  <ScrollArea className="flex-1 p-8 relative z-10">
                    <div className="space-y-8 max-w-4xl mx-auto">
                      {messages.map((msg, i) => (
                        <div key={i} className={cn(
                          "flex items-end gap-4 max-w-[85%] animate-in fade-in slide-in-from-bottom-4 duration-700",
                          msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}>
                          <div className={cn(
                            "h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl transition-all",
                            msg.role === 'user' ? "bg-white text-slate-600 ring-1 ring-slate-100" : "bg-primary text-white rotate-3"
                          )}>
                            {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                          </div>
                          <div className="space-y-2 group">
                            <div className={cn(
                              "p-6 rounded-[2rem] text-sm font-bold shadow-sm leading-relaxed whitespace-pre-wrap transition-all",
                              msg.role === 'user' ? "bg-white text-slate-800 rounded-br-none" : "bg-slate-900 text-white rounded-bl-none"
                            )}>
                              {msg.content}
                            </div>
                            {msg.role === 'bot' && i !== 0 && (
                              <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-[9px] font-black uppercase text-primary tracking-widest gap-2 bg-white/50 backdrop-blur rounded-full px-4 h-8"
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
                        <div className="flex items-end gap-4 animate-pulse">
                          <div className="h-10 w-10 rounded-2xl bg-primary text-white flex items-center justify-center">
                            <Bot className="h-5 w-5" />
                          </div>
                          <div className="bg-slate-900 text-white p-6 rounded-[2rem] rounded-bl-none shadow-sm min-w-[100px]">
                             <div className="flex gap-2">
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

                  <div className="p-8 bg-white/80 backdrop-blur-2xl border-t border-slate-100 shrink-0 relative z-10">
                    <div className="max-w-4xl mx-auto flex flex-col gap-4">
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: "Manejo de Precio", text: "Genera un script persuasivo para un cliente que dice que el producto está caro." },
                          { label: "Seguimiento", text: "Redacta un mensaje de WhatsApp para dar seguimiento a un prospecto que no respondió hace 2 días." },
                          { label: "Cierre Directo", text: "Dame una frase matadora para cerrar la venta ahora mismo por transferencia." }
                        ].map((btn) => (
                          <button 
                            key={btn.label}
                            onClick={() => setInput(btn.text)}
                            className="h-8 rounded-full px-4 text-[8px] font-black uppercase border border-slate-100 text-slate-400 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                      <form onSubmit={handleSendMessage} className="flex gap-4">
                        <Input 
                          placeholder="Escribe tu consulta de ventas..." 
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          className="h-16 rounded-2xl px-8 bg-slate-50 border-none ring-1 ring-slate-200 flex-1 font-bold text-slate-800 shadow-inner focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                        />
                        <Button 
                          type="submit" 
                          size="icon" 
                          className="h-16 w-16 rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 shrink-0 transition-all active:scale-90"
                          disabled={!input.trim() || isAiLoading}
                        >
                          <Send className="h-6 w-6" />
                        </Button>
                      </form>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full w-full flex flex-col relative bg-slate-100">
                  <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-10 text-center">
                    <div className="max-w-md space-y-8 animate-in zoom-in-95 duration-500">
                       <div className="h-20 w-20 bg-green-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20 rotate-3">
                         <Smartphone className="h-10 w-10" />
                       </div>
                       <div className="space-y-3">
                         <h3 className="text-3xl font-headline font-black text-white tracking-tight">Estación de Trabajo WhatsApp</h3>
                         <p className="text-slate-400 text-sm font-medium leading-relaxed">
                           Por razones de seguridad, WhatsApp Web requiere abrirse en su propia ventana dedicada para funcionar correctamente.
                         </p>
                       </div>
                       <div className="pt-4 space-y-4">
                         <Button asChild size="lg" className="w-full h-16 bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl shadow-green-500/30">
                           <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                             Conectar WhatsApp Ahora <ExternalLink className="ml-2 h-4 w-4" />
                           </a>
                         </Button>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                           Usa el Copiloto IA al lado para generar tus respuestas.
                         </p>
                       </div>
                    </div>
                  </div>
                  {/* Iframe invisible para intentar precargar si el navegador lo permite */}
                  <iframe 
                    src={whatsappUrl} 
                    className="w-full h-full border-none opacity-0"
                    allow="camera; microphone; clipboard-read; clipboard-write"
                    title="WhatsApp Web Interface"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

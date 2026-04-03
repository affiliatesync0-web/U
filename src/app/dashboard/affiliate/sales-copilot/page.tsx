
"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Check,
  ExternalLink,
  Zap,
  BadgeDollarSign,
  MonitorSmartphone,
  ShieldAlert,
  PanelRightClose,
  PanelRightOpen,
  SearchCode,
  Globe
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase'
import { doc, collection, query, where } from 'firebase/firestore'
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
    { role: 'bot', content: '¡Hola! Soy tu Copiloto de Ventas. ¿Tienes algún cliente difícil o necesitas un script persuasivo? Estoy listo para ayudarte a cerrar tratos en WhatsApp.' }
  ])
  const [input, setInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [searchBuyer, setSearchBuyer] = useState('')
  const [copiedIndex, setCopiedId] = useState<number | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activeTool, setActiveTool] = useState<'whatsapp' | 'google'>('whatsapp');
  const [iframeError, setIframeError] = useState(false);
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
    toast({ title: "Script Copiado", description: "Pégalo ahora en tu panel de WhatsApp." });
  };

  const openExternalTool = () => {
    const url = activeTool === 'whatsapp' ? 'https://web.whatsapp.com/' : 'https://www.google.com/';
    window.open(url, '_blank', 'width=1200,height=800');
  };

  return (
    <DashboardShell role="affiliate">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
        
        {/* Barra de Estado Superior */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Zap className="h-6 w-6 fill-primary" />
            </div>
            <div>
              <h1 className="text-xl font-headline font-black text-slate-900 tracking-tight">Sync <span className="text-primary">Command Center</span></h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> IA & Herramientas Integradas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowRightPanel(!showRightPanel)} 
              variant={showRightPanel ? "default" : "outline"}
              className="h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 transition-all"
            >
              {showRightPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              {showRightPanel ? "Ocultar Navegador" : "Ver Navegador"}
            </Button>
            <div className="h-10 px-5 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-green-600" />
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">+{profile?.whatsappNumber || 'Configurar'}</span>
            </div>
          </div>
        </div>

        {/* Estación de Trabajo */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          
          {/* PANEL 1: Prospectos (Izquierda) */}
          <div className="w-[280px] flex flex-col shrink-0 overflow-hidden">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col h-full ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-5 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-headline font-black tracking-tight text-white flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-primary" /> Prospectos
                  </h3>
                  <BadgeDollarSign className="h-4 w-4 text-primary opacity-50" />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <Input 
                    placeholder="Buscar cliente..." 
                    value={searchBuyer}
                    onChange={(e) => setSearchBuyer(e.target.value)}
                    className="bg-white/5 border-none ring-1 ring-white/10 text-white h-9 pl-9 rounded-xl text-[10px] font-medium focus:ring-primary placeholder:text-slate-600"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/50">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-2">
                    {buyersLoading ? (
                      <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary opacity-20" /></div>
                    ) : !buyers || buyers.length === 0 ? (
                      <div className="text-center py-10 opacity-20 space-y-2">
                        <Users2 className="h-8 w-8 mx-auto" />
                        <p className="text-[8px] font-black uppercase tracking-widest">Sin prospectos</p>
                      </div>
                    ) : (
                      buyers
                        .filter(b => 
                          b.firstName?.toLowerCase().includes(searchBuyer.toLowerCase()) || 
                          b.phone?.includes(searchBuyer)
                        )
                        .map((buyer) => (
                        <div key={buyer.id} className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-[10px] shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                              {buyer.firstName?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[10px] font-black text-slate-800 truncate uppercase">{buyer.firstName}</h4>
                              <p className="text-[8px] text-slate-400 font-bold tracking-tight">
                                {buyer.phone || 'Sin WhatsApp'}
                              </p>
                            </div>
                          </div>
                          <Button 
                            onClick={() => {
                              setInput(`Ayúdame a cerrar una venta con ${buyer.firstName}. ¿Qué script puedo usar para convencerlo?`);
                              toast({ title: "Cliente Seleccionado", description: `Cargando contexto para ${buyer.firstName}` });
                            }}
                            className="w-full h-7 rounded-lg bg-green-600 hover:bg-green-700 text-white font-black text-[8px] uppercase tracking-widest gap-2"
                          >
                            <MonitorSmartphone className="h-3 w-3" /> Preparar Cierre
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* PANEL 2: Sales Copilot IA (Centro) */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] flex flex-col h-full ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-5 shrink-0 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-2xl rotate-3">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-headline font-black tracking-tight text-primary flex items-center gap-2">
                      IA Sales Copilot <Sparkles className="h-3 w-3 fill-primary" />
                    </CardTitle>
                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Mentor Digital 24/7</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0 bg-[#F8FAFC] flex flex-col relative">
                <ScrollArea className="flex-1 p-5 relative z-10">
                  <div className="space-y-5">
                    {messages.map((msg, i) => (
                      <div key={i} className={cn(
                        "flex items-end gap-3 max-w-[90%] animate-in fade-in slide-in-from-bottom-2",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                      )}>
                        <div className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg",
                          msg.role === 'user' ? "bg-white text-slate-600 border border-slate-100" : "bg-primary text-white rotate-3"
                        )}>
                          {msg.role === 'user' ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                        </div>
                        <div className="space-y-2 group">
                          <div className={cn(
                            "p-4 rounded-2xl text-[11px] font-bold shadow-sm leading-relaxed whitespace-pre-wrap transition-all",
                            msg.role === 'user' ? "bg-white text-slate-800 rounded-br-none border border-slate-100" : "bg-slate-900 text-white rounded-bl-none"
                          )}>
                            {msg.content}
                          </div>
                          {msg.role === 'bot' && i !== 0 && (
                            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-[7px] font-black uppercase text-primary tracking-widest gap-2 bg-white/80 backdrop-blur rounded-full px-2 h-6 shadow-sm border border-primary/10"
                                onClick={() => handleCopyScript(msg.content, i)}
                              >
                                {copiedIndex === i ? <Check className="h-2 w-2" /> : <Copy className="h-2 w-2" />}
                                {copiedIndex === i ? "Copiado" : "Copiar Script"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isAiLoading && (
                      <div className="flex items-end gap-3 animate-pulse">
                        <div className="h-7 w-7 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg"><Bot className="h-3 w-3" /></div>
                        <div className="bg-slate-900 text-white p-4 rounded-2xl rounded-bl-none shadow-sm min-w-[60px]">
                           <div className="flex gap-1">
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

                <div className="p-5 bg-white/80 backdrop-blur-xl border-t border-slate-100 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input 
                      placeholder="Ej: Dame un script para manejar la objeción 'está caro'" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="h-10 rounded-xl px-4 bg-slate-50 border-none ring-1 ring-slate-200 flex-1 font-bold text-slate-800 text-[10px]"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shrink-0"
                      disabled={!input.trim() || isAiLoading}
                    >
                      <Send className="h-4 w-4 text-white" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PANEL 3: NAVEGADOR MULTI-HERRAMIENTA (Derecha) */}
          {showRightPanel && (
            <div className="flex-[1.5] flex flex-col h-full overflow-hidden animate-in slide-in-from-right-4 duration-500">
              <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] flex flex-col h-full ring-1 ring-slate-100">
                <CardHeader className={cn(
                  "p-4 shrink-0 flex flex-col gap-4 transition-colors duration-500",
                  activeTool === 'whatsapp' ? "bg-[#25D366]" : "bg-blue-600"
                )}>
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3 text-white">
                      {activeTool === 'whatsapp' ? <MessageSquare className="h-5 w-5 fill-white" /> : <Globe className="h-5 w-5" />}
                      <CardTitle className="text-xs font-headline font-black uppercase tracking-widest text-white">
                        {activeTool === 'whatsapp' ? "WhatsApp Web Real" : "Google Search"}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/80">Navegador Sync</span>
                    </div>
                  </div>

                  <div className="flex gap-2 bg-black/10 p-1 rounded-xl">
                    <Button 
                      onClick={() => setActiveTool('whatsapp')}
                      variant="ghost" 
                      className={cn(
                        "flex-1 h-9 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all",
                        activeTool === 'whatsapp' ? "bg-white text-green-600 shadow-lg" : "text-white/60 hover:text-white"
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-2" /> WhatsApp
                    </Button>
                    <Button 
                      onClick={() => setActiveTool('google')}
                      variant="ghost" 
                      className={cn(
                        "flex-1 h-9 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all",
                        activeTool === 'google' ? "bg-white text-blue-600 shadow-lg" : "text-white/60 hover:text-white"
                      )}
                    >
                      <Globe className="h-3.5 w-3.5 mr-2" /> Google
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-0 relative bg-slate-100">
                  {!iframeError ? (
                    <iframe 
                      key={activeTool}
                      src={activeTool === 'whatsapp' ? "https://web.whatsapp.com/" : "https://www.google.com/search?igu=1"}
                      className="w-full h-full border-none"
                      title={activeTool}
                      onError={() => setIframeError(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center bg-white">
                      <div className="h-20 w-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-6">
                        <ShieldAlert className="h-10 w-10" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-2">Bloqueo de Seguridad</h3>
                      <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed max-w-xs">
                        Tu navegador bloquea la vista interna de {activeTool === 'whatsapp' ? 'WhatsApp' : 'Google'}. Haz clic abajo para abrirlo en una ventana sincronizada.
                      </p>
                      <Button 
                        onClick={() => openExternalTool()} 
                        className={cn(
                          "h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl",
                          activeTool === 'whatsapp' ? "bg-[#25D366] shadow-green-200" : "bg-blue-600 shadow-blue-200"
                        )}
                      >
                        <ExternalLink className="h-4 w-4" /> Abrir {activeTool === 'whatsapp' ? 'WhatsApp' : 'Google'} Lateral
                      </Button>
                    </div>
                  )}

                  {/* Barra de estado inferior */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between gap-4 border border-white/10">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                         "h-8 w-8 rounded-lg flex items-center justify-center",
                         activeTool === 'whatsapp' ? "bg-green-500" : "bg-blue-500"
                       )}>
                         <Smartphone className="h-4 w-4 text-white" />
                       </div>
                       <p className="text-[9px] text-white/70 font-bold leading-tight max-w-[180px]">
                         Investiga en Google o chatea en WhatsApp sin perder de vista a la IA.
                       </p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => openExternalTool()}
                      className="bg-white text-black hover:bg-slate-200 h-8 px-4 rounded-lg font-black text-[8px] uppercase tracking-widest shrink-0"
                    >
                      Abrir afuera
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

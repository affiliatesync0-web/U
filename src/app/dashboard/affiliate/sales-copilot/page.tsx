"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  ArrowLeft,
  PanelRightClose,
  PanelRightOpen,
  Globe,
  Flame,
  Target,
  FileText,
  GraduationCap,
  ShieldCheck
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
    { role: 'bot', content: '¡Hola! Soy tu Copiloto de Ventas Sync. He analizado tu catálogo y estoy listo para ayudarte a cerrar ventas reales. ¿Quieres que redacte un script de bienvenida o te ayudo con una objeción de precio?' }
  ])
  const [input, setInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [searchBuyer, setSearchBuyer] = useState('')
  const [copiedIndex, setCopiedId] = useState<number | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [activeTool, setActiveTool] = useState<'whatsapp' | 'google' | 'course'>('whatsapp');
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  
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

  const courseUrl = "https://syncacademy.systeme.io/school/course/syncacademy";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isAiLoading])

  const handleSendMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault()
    const userMsg = customMsg || input.trim()
    if (!userMsg || isAiLoading) return

    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setIsAiLoading(true)
    setMobileShowChat(true)

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
      setMessages(prev => [...prev, { role: 'bot', content: "Error de conexión con el núcleo de IA. Por favor, reintenta." }])
    } finally {
      setIsAiLoading(false)
    }
  }

  const handleCopyScript = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Script Copiado", description: "Pégalo ahora en tu chat de WhatsApp." });
  };

  const openExternalTool = () => {
    const urls = {
      whatsapp: 'https://web.whatsapp.com/',
      google: 'https://www.google.com/',
      course: courseUrl
    };
    window.open(urls[activeTool], '_blank', 'width=1200,height=800');
  };

  const quickActions = [
    { label: "Objeción Precio", icon: Target, prompt: "Dame un script persuasivo para un cliente que dice que el producto está muy caro." },
    { label: "Bienvenida", icon: Flame, prompt: "Genera un mensaje de bienvenida de alto impacto para WhatsApp." },
    { label: "Urgencia", icon: Zap, prompt: "Crea un script usando gatillos mentales de escasez y urgencia." },
    { label: "Catálogo", icon: FileText, prompt: "Explica los beneficios de los productos de mi catálogo de forma resumida." }
  ]

  return (
    <DashboardShell role="affiliate">
      <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Sparkles className="h-6 w-6 fill-primary" />
            </div>
            <div>
              <h1 className="text-xl font-headline font-black text-slate-900 tracking-tight">Sync <span className="text-primary">Command Center</span></h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Bot de Ventas Inteligente Activo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowRightPanel(!showRightPanel)} 
              variant={showRightPanel ? "default" : "outline"}
              className="h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 transition-all shadow-lg shadow-primary/10"
            >
              {showRightPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              <span className="hidden sm:inline">{showRightPanel ? "Cerrar Navegador" : "Abrir Navegador"}</span>
            </Button>
            <div className="h-10 px-5 bg-slate-900 rounded-xl flex items-center gap-3 text-white shadow-xl">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest">+{profile?.whatsappNumber || 'Sin Vincular'}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
          
          <div className={cn("lg:w-[280px] flex-col shrink-0 overflow-hidden lg:flex", mobileShowChat ? "hidden" : "flex")}>
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col h-full ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-6 space-y-4 shrink-0">
                <h3 className="text-xs font-headline font-black tracking-tight text-white flex items-center gap-2 uppercase">
                  <Users2 className="h-4 w-4 text-primary" /> Mis Prospectos
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <Input 
                    placeholder="Buscar..." 
                    value={searchBuyer}
                    onChange={(e) => setSearchBuyer(e.target.value)}
                    className="bg-white/5 border-none ring-1 ring-white/10 text-white h-10 pl-10 rounded-xl text-[10px] font-bold placeholder:text-slate-600"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/50">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    {buyersLoading ? (
                      <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary opacity-20" /></div>
                    ) : !buyers || buyers.length === 0 ? (
                      <div className="text-center py-10 opacity-20 space-y-3">
                        <Users2 className="h-10 w-10 mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Sin registros</p>
                      </div>
                    ) : (
                      buyers
                        .filter(b => b.firstName?.toLowerCase().includes(searchBuyer.toLowerCase()))
                        .map((buyer) => (
                        <button 
                          key={buyer.id} 
                          onClick={() => {
                            setSelectedBuyer(buyer);
                            setMobileShowChat(true);
                            handleSendMessage(undefined, `Analiza a ${buyer.firstName}. ¿Qué script puedo usar para cerrarlo hoy mismo?`);
                          }}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl bg-white border transition-all group relative overflow-hidden",
                            selectedBuyer?.id === buyer.id ? "border-primary ring-2 ring-primary/10 shadow-lg" : "border-slate-100 hover:border-primary/30"
                          )}
                        >
                          <div className="flex items-center gap-4 relative z-10">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg",
                              selectedBuyer?.id === buyer.id ? "bg-primary rotate-3" : "bg-slate-200 text-slate-500"
                            )}>
                              {buyer.firstName?.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[11px] font-black text-slate-800 truncate uppercase">{buyer.firstName}</h4>
                              <p className="text-[9px] text-slate-400 font-bold truncate">
                                {buyer.phone || 'Sin número'}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className={cn("flex-1 flex-col h-full overflow-hidden lg:flex", !mobileShowChat ? "hidden" : "flex")}>
            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] flex flex-col h-full ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-6 shrink-0 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="lg:hidden text-white hover:bg-white/10"
                      onClick={() => setMobileShowChat(false)}
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl rotate-3">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-headline font-black tracking-tight text-primary flex items-center gap-2 uppercase italic">
                        Expert IA <Sparkles className="h-4 w-4 fill-primary" />
                      </CardTitle>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Asistente de Cierre</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0 bg-[#F8FAFC] flex flex-col relative">
                <ScrollArea className="flex-1 p-6 relative z-10">
                  <div className="space-y-6">
                    {messages.map((msg, i) => (
                      <div key={i} className={cn(
                        "flex items-end gap-4 max-w-[85%] animate-in fade-in slide-in-from-bottom-4 duration-500",
                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                      )}>
                        <div className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xl transition-all",
                          msg.role === 'user' ? "bg-white text-slate-600 border border-slate-100" : "bg-slate-900 text-white rotate-3"
                        )}>
                          {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className="space-y-2 group">
                          <div className={cn(
                            "p-5 rounded-[1.75rem] text-[12px] font-bold shadow-sm leading-relaxed whitespace-pre-wrap transition-all",
                            msg.role === 'user' ? "bg-white text-slate-800 rounded-br-none border border-slate-100" : "bg-slate-900 text-white rounded-bl-none"
                          )}>
                            {msg.content}
                          </div>
                          {msg.role === 'bot' && i !== 0 && (
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-[8px] font-black uppercase text-primary tracking-widest gap-2 bg-white/80 backdrop-blur rounded-full px-3 h-8 shadow-sm border border-primary/10 hover:bg-primary hover:text-white"
                                onClick={() => handleCopyScript(msg.content, i)}
                              >
                                {copiedIndex === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                {copiedIndex === i ? "Copiado" : "Copiar"}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isAiLoading && (
                      <div className="flex items-end gap-4 animate-pulse">
                        <div className="h-8 w-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xl"><Bot className="h-4 w-4" /></div>
                        <div className="bg-slate-900 text-white p-5 rounded-[1.75rem] rounded-bl-none shadow-sm min-w-[80px]">
                           <div className="flex gap-1.5">
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

                <div className="px-6 py-3 bg-white/50 border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                  {quickActions.map((action, i) => (
                    <Button 
                      key={i}
                      variant="outline" 
                      onClick={() => handleSendMessage(undefined, action.prompt)}
                      className="h-9 px-4 rounded-xl border-slate-200 bg-white hover:bg-primary/5 hover:border-primary text-[9px] font-black uppercase tracking-widest gap-2 whitespace-nowrap transition-all shadow-sm shrink-0"
                    >
                      <action.icon className="h-3 w-3 text-primary" />
                      {action.label}
                    </Button>
                  ))}
                </div>

                <div className="p-6 bg-white/80 backdrop-blur-2xl border-t border-slate-100 shrink-0">
                  <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-3">
                    <Input 
                      placeholder="Consulta a la IA..." 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="h-14 rounded-2xl px-6 bg-slate-50 border-none ring-1 ring-slate-200 flex-1 font-bold text-slate-800 text-[12px] shadow-inner"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 shrink-0 transition-all active:scale-90"
                      disabled={!input.trim() || isAiLoading}
                    >
                      <Send className="h-6 w-6 text-white" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          {showRightPanel && (
            <div className="lg:flex-[1.6] flex flex-col h-full overflow-hidden animate-in slide-in-from-right-8 duration-700">
              <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] flex flex-col h-full ring-1 ring-slate-100">
                <CardHeader className={cn(
                  "p-5 shrink-0 flex flex-col gap-4 transition-colors duration-500",
                  activeTool === 'whatsapp' ? "bg-[#25D366]" : (activeTool === 'course' ? "bg-primary" : "bg-blue-600")
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                      <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        {activeTool === 'whatsapp' ? <MessageSquare className="h-4 w-4 fill-white" /> : (activeTool === 'course' ? <GraduationCap className="h-4 w-4" /> : <Globe className="h-4 w-4" />)}
                      </div>
                      <CardTitle className="text-[11px] font-headline font-black uppercase tracking-[0.2em] text-white">
                        {activeTool === 'whatsapp' ? "WhatsApp Web" : (activeTool === 'course' ? "Sync Academy" : "Google Search")}
                      </CardTitle>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={openExternalTool}
                      className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[8px] font-black uppercase tracking-widest gap-2"
                    >
                      <ExternalLink className="h-3 w-3" /> Abrir Externo
                    </Button>
                  </div>

                  <div className="flex gap-2 bg-black/10 p-1.5 rounded-2xl">
                    <Button 
                      onClick={() => setActiveTool('whatsapp')}
                      variant="ghost" 
                      className={cn(
                        "flex-1 h-10 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                        activeTool === 'whatsapp' ? "bg-white text-green-600 shadow-xl" : "text-white/60 hover:text-white"
                      )}
                    >
                      WhatsApp
                    </Button>
                    <Button 
                      onClick={() => setActiveTool('course')}
                      variant="ghost" 
                      className={cn(
                        "flex-1 h-10 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                        activeTool === 'course' ? "bg-white text-primary shadow-xl" : "text-white/60 hover:text-white"
                      )}
                    >
                      Curso Sync
                    </Button>
                    <Button 
                      onClick={() => setActiveTool('google')}
                      variant="ghost" 
                      className={cn(
                        "flex-1 h-10 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                        activeTool === 'google' ? "bg-white text-blue-600 shadow-xl" : "text-white/60 hover:text-white"
                      )}
                    >
                      Google
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-0 relative bg-slate-100">
                  <iframe 
                    key={activeTool}
                    src={activeTool === 'whatsapp' ? "https://web.whatsapp.com/" : (activeTool === 'course' ? courseUrl : "https://www.google.com/search?igu=1")}
                    className="w-full h-full border-none"
                    title={activeTool}
                  />
                  
                  <div className="absolute top-0 left-0 right-0 p-3 bg-amber-50/95 backdrop-blur-md border-b border-amber-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <p className="text-[8px] text-amber-800 font-bold leading-tight uppercase tracking-widest">
                        Navegador Inmersivo: Usa "Abrir Externo" si el contenido no carga.
                      </p>
                    </div>
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


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
  CheckCircle2,
  Check,
  ExternalLink,
  Zap,
  BadgeDollarSign,
  MonitorSmartphone,
  ShieldAlert,
  PanelRightClose,
  PanelRightOpen
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
  const [showWhatsApp, setShowWhatsApp] = useState(true);
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

  const openExternalWhatsApp = (phoneNumber: string = '', message: string = '') => {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const url = `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'width=1000,height=800');
  };

  return (
    <DashboardShell role="affiliate">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
        
        {/* Header Superior */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Zap className="h-6 w-6 fill-primary" />
            </div>
            <div>
              <h1 className="text-xl font-headline font-black text-slate-900 tracking-tight">Sync <span className="text-primary">Command Center</span></h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> IA & WhatsApp en una sola pantalla
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowWhatsApp(!showWhatsApp)} 
              variant={showWhatsApp ? "default" : "outline"}
              className="h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 transition-all"
            >
              {showWhatsApp ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              {showWhatsApp ? "Ocultar WhatsApp" : "Mostrar WhatsApp"}
            </Button>
            <div className="h-10 px-5 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-green-600" />
              <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">+{profile?.whatsappNumber || 'Sin vincular'}</span>
            </div>
          </div>
        </div>

        {/* Cuerpo Principal: 3 Columnas */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          
          {/* Panel 1: Prospectos (Izquierda) */}
          <div className="w-[300px] flex flex-col shrink-0 overflow-hidden">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col h-full ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-5 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-headline font-black tracking-tight text-white flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-primary" /> Prospectos
                  </h3>
                  <BadgeDollarSign className="h-4 w-4 text-primary opacity-50" />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <Input 
                    placeholder="Buscar..." 
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
                        <p className="text-[8px] font-black uppercase tracking-widest">Sin datos</p>
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
                              <h4 className="text-[10px] font-black text-slate-800 truncate">{buyer.firstName}</h4>
                              <p className="text-[8px] text-slate-400 font-bold tracking-tight">
                                {buyer.phone || 'Sin número'}
                              </p>
                            </div>
                          </div>
                          <Button 
                            onClick={() => {
                              setInput(`Genera un script persuasivo para ${buyer.firstName} que está interesado en comprar.`);
                              toast({ title: "Contexto Cargado", description: "La IA ahora sabe a quién te diriges." });
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

          {/* Panel 2: Sales Copilot IA (Centro) */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] flex flex-col h-full ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-5 shrink-0 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-2xl rotate-3">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-headline font-black tracking-tight text-primary flex items-center gap-2">
                      Sales Copilot AI <Sparkles className="h-3 w-3 fill-primary" />
                    </CardTitle>
                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Mentor de Ventas 24/7</p>
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
                      placeholder="Pide un script de venta..." 
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

          {/* Panel 3: WhatsApp Web Real (Derecha) */}
          {showWhatsApp && (
            <div className="flex-1 flex flex-col h-full overflow-hidden animate-in slide-in-from-right-4 duration-500">
              <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] flex flex-col h-full ring-1 ring-slate-100">
                <CardHeader className="bg-[#25D366] text-white p-5 shrink-0 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 fill-white" />
                    <CardTitle className="text-sm font-headline font-black uppercase tracking-widest text-white">WhatsApp Web</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Conexión Segura</span>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-0 relative bg-slate-100">
                  {/* El iframe de WhatsApp Web */}
                  {!iframeError ? (
                    <iframe 
                      src="https://web.whatsapp.com/"
                      className="w-full h-full border-none"
                      title="WhatsApp Web"
                      onLoad={() => console.log("Intento de carga de WhatsApp...")}
                      onError={() => setIframeError(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center bg-white">
                      <div className="h-20 w-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-6">
                        <ShieldAlert className="h-10 w-10" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-2">Bloqueo de Seguridad</h3>
                      <p className="text-xs text-slate-500 font-medium mb-8 leading-relaxed max-w-xs">
                        Tu navegador o WhatsApp bloquean la visualización interna. Haz clic abajo para abrirlo en una ventana lateral sincronizada.
                      </p>
                      <Button 
                        onClick={() => openExternalWhatsApp()} 
                        className="bg-[#25D366] hover:bg-[#1da853] h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-green-200"
                      >
                        <ExternalLink className="h-4 w-4" /> Abrir WhatsApp Lateral
                      </Button>
                    </div>
                  )}

                  {/* Capa de aviso por si el iframe falla silenciosamente */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between gap-4 border border-white/10">
                    <p className="text-[9px] text-white/70 font-bold leading-tight">
                      Si el panel superior aparece en blanco, usa el botón de emergencia:
                    </p>
                    <Button 
                      size="sm"
                      onClick={() => openExternalWhatsApp()}
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

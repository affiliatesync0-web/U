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
    { role: 'bot', content: '¡Hola! Soy tu Copiloto de Ventas Sync. He analizado tu catálogo y estoy listo para ayudarte a cerrar ventas reales.' }
  ])
  const [input, setInput] = useState('')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [searchBuyer, setSearchBuyer] = useState('')
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [mobileShowChat, setMobileShowChat] = useState(false);
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
      setMessages(prev => [...prev, { role: 'bot', content: "Error de conexión con el núcleo de IA." }])
    } finally {
      setIsAiLoading(false)
    }
  }

  const openExternalTool = () => {
    window.open("https://web.whatsapp.com/", '_blank', 'width=1200,height=800');
  };

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
            <button 
              onClick={() => setShowRightPanel(!showRightPanel)} 
              className={cn(
                "h-10 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all",
                showRightPanel ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-900 border"
              )}
            >
              {showRightPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              <span className="hidden sm:inline">{showRightPanel ? "Cerrar Navegador" : "Abrir Navegador"}</span>
            </button>
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
                    className="bg-white/5 border-none ring-1 ring-white/10 text-white h-10 pl-10 rounded-xl text-[10px] font-bold"
                  />
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/50">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    {buyersLoading ? (
                      <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary opacity-20" /></div>
                    ) : (
                      buyers?.filter(b => b.firstName?.toLowerCase().includes(searchBuyer.toLowerCase())).map((buyer) => (
                        <button 
                          key={buyer.id} 
                          onClick={() => { setSelectedBuyer(buyer); setMobileShowChat(true); handleSendMessage(undefined, `Estrategia para ${buyer.firstName}`); }}
                          className={cn(
                            "w-full text-left p-4 rounded-2xl bg-white border transition-all",
                            selectedBuyer?.id === buyer.id ? "border-primary ring-2 ring-primary/10 shadow-lg" : "border-slate-100"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white font-black text-xs", selectedBuyer?.id === buyer.id ? "bg-primary" : "bg-slate-200")}>{buyer.firstName?.charAt(0)}</div>
                            <h4 className="text-[11px] font-black text-slate-800 uppercase">{buyer.firstName}</h4>
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
                    <Button variant="ghost" size="icon" className="lg:hidden text-white" onClick={() => setMobileShowChat(false)}><ArrowLeft className="h-6 w-6" /></Button>
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl rotate-3"><Bot className="h-6 w-6" /></div>
                    <div>
                      <CardTitle className="text-xl font-headline font-black text-primary uppercase italic">Expert IA</CardTitle>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Asistente de Cierre</p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-hidden p-0 bg-[#F8FAFC] flex flex-col relative">
                <ScrollArea className="flex-1 p-6 relative z-10">
                  <div className="space-y-6">
                    {messages.map((msg, i) => (
                      <div key={i} className={cn("flex items-end gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                        <div className={cn("p-5 rounded-[1.75rem] text-[12px] font-bold shadow-sm", msg.role === 'user' ? "bg-white border" : "bg-slate-900 text-white")}>{msg.content}</div>
                      </div>
                    ))}
                    {isAiLoading && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                <div className="p-6 bg-white border-t flex gap-3">
                  <Input 
                    placeholder="Consulta a la IA..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="h-14 rounded-2xl px-6 bg-slate-50 border-none ring-1 ring-slate-200 flex-1 font-bold"
                  />
                  <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-primary" onClick={() => handleSendMessage()} disabled={isAiLoading}><Send className="h-6 w-6 text-white" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {showRightPanel && (
            <div className="lg:flex-[1.6] flex flex-col h-full overflow-hidden">
              <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] flex flex-col h-full ring-1 ring-slate-100">
                <CardHeader className="p-5 bg-slate-900 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white">
                      <Globe className="h-4 w-4 text-primary" />
                      <CardTitle className="text-[11px] font-headline font-black uppercase tracking-[0.2em]">Sync Navigator</CardTitle>
                    </div>
                    <Button size="sm" variant="ghost" onClick={openExternalTool} className="text-white text-[8px] font-black uppercase gap-2"><ExternalLink className="h-3 w-3" /> Abrir Externo</Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 bg-slate-100 relative">
                  <iframe src="https://web.whatsapp.com/" className="w-full h-full border-none" title="Sync Navigation Tool" />
                  <div className="absolute top-0 left-0 right-0 p-3 bg-amber-50/95 border-b border-amber-100 flex items-center gap-3">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <p className="text-[8px] text-amber-800 font-bold uppercase tracking-widest">Conexión Segura Sync</p>
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
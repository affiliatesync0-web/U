"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Send, 
  Users, 
  Search,
  ArrowLeft,
  Crown,
  CheckCheck,
  Flame,
  MessageCircle,
  Loader2
} from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase'
import { collection, query, orderBy, limit, serverTimestamp, where } from 'firebase/firestore'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  userId?: string
  senderId?: string
  affiliateId?: string
  userName: string
  content: string
  type: 'text'
  createdAt: any
  fromAdmin?: boolean
}

export default function AdminSupportPage() {
  const db = useFirestore()
  const { user } = useUser()
  
  const [activeTab, setActiveTab] = useState<'community' | 'private'>('community')
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null)
  const [msgInput, setMsgInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)
  
  const scrollRefComm = useRef<HTMLDivElement>(null)
  const scrollRefPriv = useRef<HTMLDivElement>(null)

  // 1. Cargar Afiliados para Chat Privado
  const affiliatesQuery = useMemoFirebase(() => collection(db, 'affiliates'), [db])
  const { data: affiliates, isLoading: loadingAffs } = useCollection(affiliatesQuery)

  // 2. Chat de Comunidad
  const communityQuery = useMemoFirebase(() => 
    query(collection(db, 'community_messages'), orderBy('createdAt', 'asc'), limit(100)), 
  [db])
  const { data: communityMessages } = useCollection<Message>(communityQuery)

  // 3. Chat Privado Filtrado por Socio Seleccionado
  const privateQuery = useMemoFirebase(() => {
    if (!selectedAffiliate || !db) return null;
    return query(
      collection(db, 'private_messages'),
      where('affiliateId', '==', selectedAffiliate.id),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [db, selectedAffiliate]);
  
  const { data: privateMessages } = useCollection<Message>(privateQuery)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'community' && scrollRefComm.current) {
        scrollRefComm.current.scrollIntoView({ behavior: 'smooth' });
      } else if (activeTab === 'private' && scrollRefPriv.current) {
        scrollRefPriv.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [communityMessages, privateMessages, activeTab, selectedAffiliate, mobileShowChat]);

  const formatTime = (createdAt: any) => {
    if (!createdAt) return "";
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgInput.trim() || !user || !db) return

    const content = msgInput.trim();
    setMsgInput('')

    if (activeTab === 'community') {
      addDocumentNonBlocking(collection(db, 'community_messages'), {
        userId: user.uid,
        userName: "ADMINISTRADOR",
        content,
        type: 'text',
        createdAt: serverTimestamp()
      })
    } else if (selectedAffiliate) {
      addDocumentNonBlocking(collection(db, 'private_messages'), {
        senderId: user.uid,
        affiliateId: selectedAffiliate.id,
        userName: "ADMINISTRADOR",
        content,
        type: 'text',
        fromAdmin: true,
        createdAt: serverTimestamp()
      });
    }
  }

  const filteredAffiliates = affiliates?.filter(a => 
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <DashboardShell role="admin">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
        <Tabs defaultValue="community" className="flex-1 flex flex-col" onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="h-14 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm w-full md:w-fit self-center">
            <TabsTrigger value="community" className="flex-1 md:w-48 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-[#075E54] data-[state=active]:text-white">
              <Users className="h-4 w-4" /> COMUNIDAD
            </TabsTrigger>
            <TabsTrigger value="private" className="flex-1 md:w-48 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-[#075E54] data-[state=active]:text-white">
              <MessageCircle className="h-4 w-4" /> CHATS PRIVADOS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="community" className="flex-1 mt-4 overflow-hidden">
            <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-[#E5DDD5] overflow-hidden flex flex-col relative ring-1 ring-slate-100">
              <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none" />
              
              <CardHeader className="bg-[#075E54] text-white p-6 shrink-0 z-10 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white shadow-xl"><Flame className="h-6 w-6" /></div>
                  <div>
                    <CardTitle className="text-sm font-headline font-black uppercase tracking-widest text-white">Grupo Oficial Sync</CardTitle>
                    <p className="text-[9px] text-white/60 font-black uppercase tracking-widest">Soporte Maestro Activo</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col z-10">
                <ScrollArea className="flex-1 p-6 md:p-10">
                  <div className="space-y-4">
                    {communityMessages?.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", msg.userName === "ADMINISTRADOR" ? "ml-auto items-end" : "items-start")}>
                        <div className="flex items-center gap-2 mb-1 px-3">
                          <span className={cn("text-[9px] font-black uppercase tracking-widest", msg.userName === "ADMINISTRADOR" ? "text-[#075E54]" : "text-slate-500")}>{msg.userName}</span>
                          {msg.userName === "ADMINISTRADOR" && <Crown className="h-3 w-3 text-amber-500" />}
                        </div>
                        <div className={cn("p-4 rounded-[1.5rem] text-[13px] font-medium shadow-sm leading-relaxed relative", 
                          msg.userName === "ADMINISTRADOR" ? "bg-[#DCF8C6] text-slate-800 rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                        )}>
                          {msg.content}
                          <div className={cn("mt-1.5 flex items-center gap-1 text-[8px] font-black uppercase opacity-40 justify-end", msg.userName === "ADMINISTRADOR" ? "text-slate-600" : "text-slate-500")}>
                            {formatTime(msg.createdAt)}
                            {msg.userName === "ADMINISTRADOR" && <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRefComm} />
                  </div>
                </ScrollArea>
                
                <div className="p-4 bg-[#F0F2F5] shrink-0 border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
                    <Input 
                      placeholder="Escribe un mensaje al grupo..." 
                      value={msgInput} 
                      onChange={(e) => setMsgInput(e.target.value)} 
                      className="h-14 bg-white border-none shadow-sm rounded-2xl px-6 font-medium text-slate-800 focus-visible:ring-1 focus-visible:ring-[#075E54]" 
                    />
                    <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-[#075E54] hover:bg-[#054c44] text-white shadow-xl shrink-0" disabled={!msgInput.trim()}>
                      <Send className="h-6 w-6" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="private" className="flex-1 mt-4 overflow-hidden h-full">
            <div className="flex gap-4 h-full">
              {/* Lista de Contactos */}
              <Card className={cn("w-full md:w-80 shrink-0 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100", mobileShowChat ? "hidden md:flex" : "flex")}>
                <CardHeader className="p-6 bg-slate-50 border-b">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Buscar socio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-12 bg-white border-none ring-1 ring-slate-200 pl-11 rounded-xl text-[11px] font-black uppercase" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    {loadingAffs ? (
                      <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                    ) : filteredAffiliates.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-[10px] font-black uppercase">No hay socios</div>
                    ) : (
                      <div className="p-3 space-y-2">
                        {filteredAffiliates.map((aff) => (
                          <button key={aff.id} onClick={() => { setSelectedAffiliate(aff); setMobileShowChat(true); }} className={cn("w-full flex items-center gap-4 p-4 rounded-2xl transition-all", selectedAffiliate?.id === aff.id ? "bg-[#075E54]/5 ring-1 ring-[#075E54]/10 shadow-sm" : "hover:bg-slate-50 text-slate-600")}>
                            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center font-black text-xs shadow-md shrink-0", selectedAffiliate?.id === aff.id ? "bg-[#075E54] text-white" : "bg-slate-200 text-slate-500")}>
                              {aff.firstName?.charAt(0)}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-[11px] font-black text-slate-800 uppercase truncate">{aff.firstName} {aff.lastName}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{aff.status || 'Active'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat Privado Seleccionado */}
              <Card className={cn("flex-1 border-none shadow-2xl rounded-[3rem] bg-[#E5DDD5] overflow-hidden flex flex-col h-full relative ring-1 ring-slate-100", !mobileShowChat ? "hidden md:flex" : "flex")}>
                <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none" />
                
                {!selectedAffiliate ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white/50 backdrop-blur-sm z-10">
                    <div className="h-32 w-32 bg-slate-200 rounded-full flex items-center justify-center mb-8 shadow-inner"><MessageCircle className="h-16 w-16 text-slate-400" /></div>
                    <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest leading-none">Canal Privado</h3>
                    <p className="text-sm font-medium text-slate-400 mt-4 max-w-xs">Selecciona un socio de la lista para iniciar una conversación 1 a 1.</p>
                  </div>
                ) : (
                  <>
                    <CardHeader className="bg-[#075E54] text-white p-6 shrink-0 flex items-center justify-between border-b border-white/10 z-10">
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden text-white h-10 w-10 rounded-full" onClick={() => setMobileShowChat(false)}><ArrowLeft className="h-6 w-6" /></Button>
                        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white shadow-xl font-black text-sm">{selectedAffiliate.firstName?.charAt(0)}</div>
                        <div>
                          <CardTitle className="text-sm font-headline font-black uppercase tracking-widest text-white">{selectedAffiliate.firstName} {selectedAffiliate.lastName}</CardTitle>
                          <p className="text-[9px] text-white/60 font-black uppercase">Chat Directo Privado</p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col z-10">
                      <ScrollArea className="flex-1 p-6 md:p-10">
                        <div className="space-y-4">
                          {privateMessages?.map((msg) => (
                            <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", msg.fromAdmin ? "ml-auto items-end" : "items-start")}>
                              <div className={cn("p-4 rounded-[1.5rem] text-[13px] font-medium shadow-sm leading-relaxed relative", 
                                msg.fromAdmin ? "bg-[#DCF8C6] text-slate-800 rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                              )}>
                                {msg.content}
                                <div className={cn("mt-1.5 flex items-center gap-1 text-[8px] font-black uppercase opacity-40 justify-end", msg.fromAdmin ? "text-slate-600" : "text-slate-500")}>
                                  {formatTime(msg.createdAt)}
                                  {msg.fromAdmin && <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div ref={scrollRefPriv} />
                        </div>
                      </ScrollArea>
                      
                      <div className="p-4 bg-[#F0F2F5] shrink-0 border-t">
                        <form onSubmit={handleSendMessage} className="flex gap-3">
                          <Input 
                            placeholder="Escribe un mensaje privado..." 
                            value={msgInput} 
                            onChange={(e) => setMsgInput(e.target.value)} 
                            className="h-14 bg-white border-none shadow-sm rounded-2xl px-6 font-medium text-slate-800 focus-visible:ring-1 focus-visible:ring-[#075E54]" 
                          />
                          <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-[#075E54] hover:bg-[#054c44] text-white shadow-xl shrink-0" disabled={!msgInput.trim()}>
                            <Send className="h-6 w-6" />
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}

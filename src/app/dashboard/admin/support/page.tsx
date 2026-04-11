
"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Loader2, 
  Mic, 
  MicOff,
  ShieldCheck,
  Flame,
  AlertCircle,
  Users,
  User,
  Search,
  ChevronRight,
  PhoneOff,
  RefreshCw,
  MessageCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase'
import { collection, query, orderBy, limit, serverTimestamp, doc, where, onSnapshot } from 'firebase/firestore'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  userId: string
  userName: string
  content: string
  createdAt: any
  receiverId?: string
}

export default function AdminSupportPage() {
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  
  const [activeTab, setActiveTab] = useState<'community' | 'private'>('community')
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null)
  const [msgInput, setMsgInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [isInCall, setIsInCall] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null)
  
  const scrollRefComm = useRef<HTMLDivElement>(null)
  const scrollRefPriv = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const affiliatesQuery = useMemoFirebase(() => collection(db, 'affiliates'), [db])
  const { data: affiliates } = useCollection(affiliatesQuery)

  const communityQuery = useMemoFirebase(() => 
    query(collection(db, 'community_messages'), orderBy('createdAt', 'asc'), limit(50)), 
  [db])
  const { data: communityMessages } = useCollection<Message>(communityQuery)

  const privateQuery = useMemoFirebase(() => {
    if (!selectedAffiliate || !user) return null;
    return query(
      collection(db, 'private_messages'),
      where('chatId', 'in', [`${user.uid}_${selectedAffiliate.id}`, `${selectedAffiliate.id}_${user.uid}`]),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
  }, [db, selectedAffiliate, user]);
  const { data: privateMessages } = useCollection<Message>(privateQuery)

  useEffect(() => {
    if (activeTab === 'community' && scrollRefComm.current) {
      scrollRefComm.current.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'private' && scrollRefPriv.current) {
      scrollRefPriv.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [communityMessages, privateMessages, activeTab, selectedAffiliate]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgInput.trim() || !user) return

    const content = msgInput.trim();
    setMsgInput('')

    if (activeTab === 'community') {
      addDocumentNonBlocking(collection(db, 'community_messages'), {
        userId: user.uid,
        userName: "ADMINISTRADOR",
        content,
        createdAt: serverTimestamp()
      })
    } else if (selectedAffiliate) {
      const chatId = `${user.uid}_${selectedAffiliate.id}`;
      addDocumentNonBlocking(collection(db, 'private_messages'), {
        senderId: user.uid,
        receiverId: selectedAffiliate.id,
        userName: "ADMINISTRADOR",
        content,
        chatId,
        createdAt: serverTimestamp()
      });

      addDocumentNonBlocking(collection(db, 'notifications'), {
        userId: selectedAffiliate.id,
        title: '💬 Nuevo Mensaje Privado',
        message: 'El administrador te ha enviado un mensaje personal.',
        type: 'system',
        createdAt: new Date().toISOString(),
        isRead: false,
        actionUrl: '/dashboard/affiliate/support'
      });
    }
  }

  const startCall = async (targetId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      setHasMicPermission(true);
      streamRef.current = stream;
      setIsInCall(true);

      const callData = {
        isLive: true,
        startedAt: new Date().toISOString(),
        adminId: user?.uid,
        type: 'private',
        targetUserId: targetId
      };

      setDocumentNonBlocking(doc(db, 'site_config', 'support_status'), callData, { merge: true });
    } catch (e) {
      setHasMicPermission(false);
      toast({ variant: "destructive", title: "Fallo de Hardware", description: "Habilita el micrófono para llamar." });
    }
  }

  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    updateDocumentNonBlocking(doc(db, 'site_config', 'support_status'), { isLive: false });
    setIsInCall(false);
  }

  const filteredAffiliates = affiliates?.filter(a => 
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <DashboardShell role="admin">
      <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
        
        <Tabs defaultValue="community" className="flex-1 flex flex-col" onValueChange={(v: any) => setActiveTab(v)}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <TabsList className="h-14 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm">
              <TabsTrigger value="community" className="px-8 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Users className="h-4 w-4" /> COMUNIDAD
              </TabsTrigger>
              <TabsTrigger value="private" className="px-8 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <MessageCircle className="h-4 w-4" /> MENSAJES PRIVADOS
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <div className="h-10 px-4 bg-green-50 rounded-xl flex items-center gap-2 border border-green-100">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">SISTEMA ONLINE</span>
              </div>
            </div>
          </div>

          <TabsContent value="community" className="flex-1 mt-0 outline-none">
            <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-6 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-xl rotate-3">
                    <Flame className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-headline font-black uppercase tracking-widest">Grupo Oficial Sync</CardTitle>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Canal de avisos para toda la red</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/30 flex flex-col">
                <ScrollArea className="flex-1 p-8">
                  <div className="space-y-6">
                    {communityMessages?.map((msg) => (
                      <div key={msg.id} className={cn(
                        "flex flex-col max-w-[70%] animate-in fade-in slide-in-from-bottom-2",
                        msg.userName === "ADMINISTRADOR" ? "ml-auto items-end" : "items-start"
                      )}>
                        <span className={cn("text-[9px] font-black uppercase tracking-tighter mb-1 px-2", msg.userName === "ADMINISTRADOR" ? "text-primary" : "text-slate-400")}>
                          {msg.userName} {msg.userName === "ADMINISTRADOR" && "✓"}
                        </span>
                        <div className={cn(
                          "p-4 rounded-[1.5rem] text-[13px] font-bold shadow-sm leading-relaxed",
                          msg.userName === "ADMINISTRADOR" 
                            ? "bg-slate-900 text-white rounded-tr-none border border-primary/20" 
                            : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRefComm} />
                  </div>
                </ScrollArea>
                <div className="p-6 bg-white border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-3 bg-slate-100 p-2 rounded-[2rem] ring-1 ring-slate-200">
                    <Input placeholder="Escribe al grupo..." value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="h-14 bg-transparent border-none shadow-none focus-visible:ring-0 flex-1 font-bold text-slate-800 px-6" />
                    <Button type="submit" size="icon" className="h-14 w-14 rounded-full bg-slate-900 shadow-xl shrink-0"><Send className="h-6 w-6 text-white" /></Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="private" className="flex-1 mt-0 outline-none h-full">
            <div className="flex gap-6 h-full">
              <Card className="w-80 shrink-0 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
                <CardHeader className="p-6 space-y-4 bg-slate-50 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Buscar socio..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-10 bg-white border-none ring-1 ring-slate-200 pl-10 rounded-xl text-xs font-bold"
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-2">
                      {filteredAffiliates.map((aff) => (
                        <button 
                          key={aff.id}
                          onClick={() => setSelectedAffiliate(aff)}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                            selectedAffiliate?.id === aff.id ? "bg-slate-900 text-white shadow-xl rotate-1" : "hover:bg-slate-50 text-slate-600"
                          )}
                        >
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs", selectedAffiliate?.id === aff.id ? "bg-primary text-white shadow-lg" : "bg-slate-200 text-slate-500")}>
                            {aff.firstName?.charAt(0)}
                          </div>
                          <div className="flex-1 text-left truncate">
                            <p className="text-xs font-black uppercase truncate">{aff.firstName} {aff.lastName}</p>
                            <p className="text-[9px] font-bold opacity-50">{aff.status}</p>
                          </div>
                          {selectedAffiliate?.id === aff.id && <ChevronRight className="h-4 w-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="flex-1 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
                {!selectedAffiliate ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50/50">
                    <div className="h-20 w-20 bg-slate-200 rounded-[2rem] flex items-center justify-center text-slate-400 mb-6 opacity-50 shadow-inner">
                      <MessageCircle className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Selecciona un socio</h3>
                    <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest">Para iniciar una conversación privada o llamada de voz</p>
                  </div>
                ) : (
                  <>
                    <CardHeader className="bg-slate-900 text-white p-6 shrink-0 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl rotate-3 font-black text-sm">
                          {selectedAffiliate.firstName?.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-sm font-headline font-black uppercase tracking-widest">{selectedAffiliate.firstName} {selectedAffiliate.lastName}</CardTitle>
                          <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-0.5">Socio Platinum • Chat Privado</p>
                        </div>
                      </div>
                      <Button onClick={() => startCall(selectedAffiliate.id)} size="icon" className="h-12 w-12 rounded-xl bg-primary text-white shadow-xl hover:scale-105 transition-all">
                        <Phone className="h-5 w-5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/30 flex flex-col">
                      <ScrollArea className="flex-1 p-8">
                        <div className="space-y-6">
                          {privateMessages?.map((msg) => (
                            <div key={msg.id} className={cn(
                              "flex flex-col max-w-[70%] animate-in fade-in slide-in-from-bottom-2",
                              msg.userName === "ADMINISTRADOR" ? "ml-auto items-end" : "items-start"
                            )}>
                              <div className={cn(
                                "p-4 rounded-[1.5rem] text-[13px] font-bold shadow-sm leading-relaxed",
                                msg.userName === "ADMINISTRADOR" 
                                  ? "bg-slate-900 text-white rounded-tr-none" 
                                  : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                              )}>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                          <div ref={scrollRefPriv} />
                        </div>
                      </ScrollArea>
                      <div className="p-6 bg-white border-t">
                        <form onSubmit={handleSendMessage} className="flex gap-3 bg-slate-100 p-2 rounded-[2rem] ring-1 ring-slate-200">
                          <Input placeholder={`Escribe a ${selectedAffiliate.firstName}...`} value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="h-14 bg-transparent border-none shadow-none focus-visible:ring-0 flex-1 font-bold text-slate-800 px-6" />
                          <Button type="submit" size="icon" className="h-14 w-14 rounded-full bg-slate-900 shadow-xl shrink-0"><Send className="h-6 w-6 text-white" /></Button>
                        </form>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {isInCall && (
          <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in duration-500">
            <Card className="w-full max-w-md border-none shadow-2xl rounded-[4rem] bg-slate-800 p-12 text-center ring-4 ring-primary/20">
              <div className="relative mb-10 mx-auto w-32 h-32">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative z-10 h-full w-full rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                  <User className="h-16 w-16 text-primary" />
                </div>
              </div>
              <div className="space-y-4 mb-12">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Llamada Privada</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronización con el Socio</p>
                <Badge className="bg-red-500/20 text-red-500 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase animate-pulse">AUDIO ACTIVO</Badge>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex justify-center gap-4">
                  <Button size="icon" variant="ghost" onClick={() => setIsMicMuted(!isMicMuted)} className={cn("h-16 w-16 rounded-full border-2", isMicMuted ? "bg-red-500/20 border-red-500 text-red-500" : "bg-white/10 border-white/10 text-white")}>
                    {isMicMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                  </Button>
                </div>
                <Button onClick={endCall} className="w-full h-16 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                  <PhoneOff className="h-6 w-6" /> FINALIZAR LLAMADA
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

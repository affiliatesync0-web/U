
"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Loader2, 
  Mic, 
  MicOff,
  Trash2,
  ShieldCheck,
  Flame,
  AlertCircle,
  Bell,
  Users,
  User,
  Search,
  ChevronRight,
  MoreVertical,
  RefreshCw,
  PhoneOff
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase'
import { collection, query, orderBy, limit, serverTimestamp, doc, getDocs, where } from 'firebase/firestore'
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
  
  const scrollRef = useRef<HTMLDivElement>(null)
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
  const { data: communityMessages, isLoading: loadingCommunity } = useCollection<Message>(communityQuery)

  const privateQuery = useMemoFirebase(() => {
    if (!selectedAffiliate || !user) return null;
    return query(
      collection(db, 'private_messages'),
      where('chatId', 'in', [`${user.uid}_${selectedAffiliate.id}`, `${selectedAffiliate.id}_${user.uid}`]),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
  }, [db, selectedAffiliate, user]);
  const { data: privateMessages, isLoading: loadingPrivate } = useCollection<Message>(privateQuery)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [communityMessages, privateMessages, activeTab]);

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
        title: '💬 Nuevo mensaje privado',
        message: 'El administrador te ha enviado un mensaje personal.',
        type: 'system',
        createdAt: new Date().toISOString(),
        isRead: false,
        actionUrl: '/dashboard/affiliate/support'
      });
    }
  }

  const startCall = async (targetId?: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      setHasMicPermission(true);
      streamRef.current = stream;
      setIsInCall(true);

      const callData = {
        isLive: true,
        startedAt: new Date().toISOString(),
        adminId: user?.uid,
        type: targetId ? 'private' : 'group',
        targetUserId: targetId || null
      };

      const statusRef = doc(db, 'site_config', 'support_status');
      setDocumentNonBlocking(statusRef, callData, { merge: true });
    } catch (e) {
      setHasMicPermission(false);
      toast({
        variant: "destructive",
        title: "Permisos Denegados",
        description: "Habilita el micrófono en el icono del candado de tu navegador para iniciar la llamada."
      });
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
      <div className="h-[calc(100vh-140px)] flex gap-6 overflow-hidden">
        
        <div className="w-80 flex flex-col gap-4 shrink-0 h-full">
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col h-full ring-1 ring-slate-100">
            <CardHeader className="bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between text-white">
                <h2 className="text-sm font-black uppercase tracking-widest">Mensajería Sync</h2>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="Buscar socio..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 bg-white/5 border-none ring-1 ring-white/10 text-white pl-10 rounded-xl text-xs"
                />
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/30">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-2">
                  <button 
                    onClick={() => { setActiveTab('community'); setSelectedAffiliate(null); }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                      activeTab === 'community' ? "bg-primary text-white shadow-xl shadow-primary/20 rotate-1" : "hover:bg-white text-slate-600"
                    )}
                  >
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-inner", activeTab === 'community' ? "bg-white/20" : "bg-primary/10 text-primary")}>
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-black uppercase">Comunidad Sync</p>
                      <p className={cn("text-[9px] font-bold", activeTab === 'community' ? "text-white/70" : "text-slate-400")}>Chat Grupal Abierto</p>
                    </div>
                  </button>

                  <div className="pt-4 pb-2 px-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">SOCIOS ACTIVOS</p>
                  </div>

                  {filteredAffiliates.map((aff) => (
                    <button 
                      key={aff.id}
                      onClick={() => { setActiveTab('private'); setSelectedAffiliate(aff); }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                        selectedAffiliate?.id === aff.id ? "bg-slate-900 text-white shadow-xl" : "hover:bg-white text-slate-600"
                      )}
                    >
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs", selectedAffiliate?.id === aff.id ? "bg-primary text-white" : "bg-slate-200 text-slate-500")}>
                        {aff.firstName?.charAt(0)}
                      </div>
                      <div className="flex-1 text-left truncate">
                        <p className="text-xs font-black uppercase truncate">{aff.firstName} {aff.lastName}</p>
                        <p className={cn("text-[9px] font-bold", selectedAffiliate?.id === aff.id ? "text-slate-400" : "text-slate-400")}>{aff.status}</p>
                      </div>
                      {selectedAffiliate?.id === aff.id && <ChevronRight className="h-4 w-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden flex flex-col h-full ring-1 ring-slate-100">
            <CardHeader className="bg-slate-900 text-white p-6 shrink-0 flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-xl rotate-3">
                  {activeTab === 'community' ? <Flame className="h-6 w-6" /> : <User className="h-6 w-6" />}
                </div>
                <div>
                  <CardTitle className="text-sm font-headline font-black uppercase tracking-widest">
                    {activeTab === 'community' ? "Chat Comunitario" : `${selectedAffiliate?.firstName} ${selectedAffiliate?.lastName}`}
                  </CardTitle>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    {activeTab === 'community' ? "Sincronización de Estrategias" : "Conversación Privada"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => startCall(selectedAffiliate?.id)} size="icon" className="h-12 w-12 rounded-xl bg-primary text-white shadow-xl hover:scale-105 transition-all">
                  <Phone className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/30 flex flex-col relative">
              <ScrollArea className="flex-1 p-8">
                <div className="space-y-6">
                  {(activeTab === 'community' ? communityMessages : privateMessages)?.map((msg) => (
                    <div key={msg.id} className={cn(
                      "flex flex-col max-w-[75%] animate-in fade-in slide-in-from-bottom-2",
                      msg.userName === "ADMINISTRADOR" ? "ml-auto items-end" : "items-start"
                    )}>
                      <div className="flex items-center gap-2 mb-1 px-2">
                        <span className={cn("text-[9px] font-black uppercase tracking-tighter", msg.userName === "ADMINISTRADOR" ? "text-primary" : "text-slate-400")}>
                          {msg.userName}
                        </span>
                        {msg.userName === "ADMINISTRADOR" && <ShieldCheck className="h-3 w-3 text-primary" />}
                      </div>
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
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-3 bg-slate-50 p-2 rounded-[2rem] ring-1 ring-slate-200">
                  <Input 
                    placeholder={activeTab === 'community' ? "Escribe un comunicado grupal..." : `Mensaje privado para ${selectedAffiliate?.firstName}...`}
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    className="h-14 bg-transparent border-none shadow-none focus-visible:ring-0 flex-1 font-bold text-slate-800 px-6"
                  />
                  <Button type="submit" size="icon" className="h-14 w-14 rounded-full bg-slate-900 shadow-xl shrink-0 transition-transform active:scale-90 hover:bg-primary">
                    <Send className="h-6 w-6 text-white" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {isInCall && (
          <Card className="w-[450px] border-none shadow-2xl rounded-[3.5rem] bg-slate-900 overflow-hidden flex flex-col relative ring-4 ring-primary/20 animate-in slide-in-from-right-4 shrink-0">
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="relative mb-8">
                <div className="h-32 w-32 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                  <User className="h-16 w-16 text-primary" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-primary/40 animate-ping" />
              </div>
              
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Llamada de Voz en Curso</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                {selectedAffiliate ? `${selectedAffiliate.firstName} ${selectedAffiliate.lastName}` : "Socio Sync"}
              </p>

              {hasMicPermission === false && (
                <div className="mt-8 space-y-4 px-10">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                  <p className="text-red-400 text-xs font-medium">Micrófono bloqueado. Habilita el acceso en tu navegador.</p>
                  <Button onClick={() => startCall(selectedAffiliate?.id)} size="sm" className="bg-primary text-white rounded-xl gap-2 font-black text-[10px] uppercase">
                    <RefreshCw className="h-3.5 w-3.5" /> REINTENTAR
                  </Button>
                </div>
              )}
            </div>
            
            <div className="absolute top-10 left-10 right-10 flex justify-between items-center">
               <Badge className="bg-red-500 text-white border-none px-4 py-1.5 rounded-full text-[9px] font-black uppercase animate-pulse">EN LLAMADA</Badge>
               <div className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white"><MoreVertical className="h-5 w-5" /></div>
            </div>

            <div className="absolute bottom-10 left-0 right-0 px-10 flex flex-col gap-4">
              <div className="flex justify-center gap-4">
                 <Button size="icon" variant="ghost" onClick={() => setIsMicMuted(!isMicMuted)} className={cn("h-14 w-14 rounded-full backdrop-blur-xl border", isMicMuted ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white")}>
                   {isMicMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                 </Button>
              </div>
              <Button onClick={endCall} className="w-full h-16 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                <PhoneOff className="h-6 w-6" /> FINALIZAR LLAMADA
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}

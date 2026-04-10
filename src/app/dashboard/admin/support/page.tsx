
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
  ShieldCheck,
  Flame,
  AlertCircle,
  Users,
  User,
  Search,
  ChevronRight,
  PhoneOff,
  RefreshCw
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
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Pedir permisos de notificación al entrar si no se tienen
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
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [communityMessages, privateMessages, activeTab]);

  // Escuchador de mensajes globales para notificar si el admin no está viendo ese chat
  useEffect(() => {
    if (db && user) {
      const now = new Date();
      
      const qAllPriv = query(
        collection(db, 'private_messages'), 
        where('receiverId', '==', 'affiliatesync0@gmail.com'),
        orderBy('createdAt', 'desc'), 
        limit(1)
      );

      const unsubscribe = onSnapshot(qAllPriv, (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            const msg = change.doc.data();
            const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
            
            // Notificar solo si es un mensaje nuevo y no es del afiliado que tengo seleccionado actualmente
            if (msgDate > now && msg.senderId !== selectedAffiliate?.id) {
              toast({ 
                title: `📩 Nuevo mensaje de ${msg.userName}`, 
                description: msg.content,
                duration: 5000 
              });
              if (Notification.permission === "granted") {
                new Notification(`Sync Privado: ${msg.userName}`, { body: msg.content });
              }
            }
          }
        });
      });

      return () => unsubscribe();
    }
  }, [db, user, selectedAffiliate, toast]);

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

      // Notificación de sistema interna para el socio
      addDocumentNonBlocking(collection(db, 'notifications'), {
        userId: selectedAffiliate.id,
        title: '💬 Nuevo Mensaje del Administrador',
        message: 'Has recibido un mensaje privado prioritario.',
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

      setDocumentNonBlocking(doc(db, 'site_config', 'support_status'), callData, { merge: true });
    } catch (e) {
      setHasMicPermission(false);
      toast({
        variant: "destructive",
        title: "Permisos Denegados",
        description: "Habilita el micrófono para iniciar la llamada de voz nativa."
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
                <h2 className="text-sm font-black uppercase tracking-widest">Sincronización Sync</h2>
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
                      activeTab === 'community' ? "bg-primary text-white shadow-xl rotate-1" : "hover:bg-white text-slate-600"
                    )}
                  >
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-inner", activeTab === 'community' ? "bg-white/20" : "bg-primary/10 text-primary")}>
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-black uppercase">Comunidad Sync</p>
                      <p className={cn("text-[9px] font-bold", activeTab === 'community' ? "text-white/70" : "text-slate-400")}>Canal Abierto</p>
                    </div>
                  </button>

                  <div className="pt-4 pb-2 px-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">MENSAJERÍA PRIVADA</p>
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
                        <p className="text-[9px] font-bold text-slate-400">{aff.status}</p>
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
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Centro de Apoyo Sync Academy</p>
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
                    placeholder={activeTab === 'community' ? "Escribe a la comunidad..." : `Mensaje privado para ${selectedAffiliate?.firstName}...`}
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
          <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in duration-500">
            <Card className="w-full max-w-md border-none shadow-2xl rounded-[4rem] bg-slate-800 overflow-hidden flex flex-col relative ring-4 ring-primary/20 text-center p-12">
              <div className="relative mb-10 mx-auto w-32 h-32">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative z-10 h-full w-full rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                  <User className="h-16 w-16 text-primary" />
                </div>
              </div>

              <div className="space-y-4 mb-12">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Llamada de Voz en Curso</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronización con el Afiliado</p>
                <Badge className="bg-red-500/20 text-red-500 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase animate-pulse">AUDIO ACTIVO</Badge>
              </div>

              {hasMicPermission === false && (
                <div className="mb-8 space-y-4">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                  <p className="text-red-400 text-xs font-medium">Micrófono bloqueado por el sistema.</p>
                  <Button onClick={() => startCall(selectedAffiliate?.id)} size="sm" className="bg-primary text-white rounded-xl gap-2 font-black text-[10px] uppercase">
                    <RefreshCw className="h-3.5 w-3.5" /> REINTENTAR
                  </Button>
                </div>
              )}

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


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
  Users, 
  Loader2, 
  Mic, 
  ShieldCheck, 
  Crown,
  PhoneOff,
  MicOff,
  MessageCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc, updateDocumentNonBlocking } from '@/firebase'
import { collection, query, orderBy, limit, serverTimestamp, doc, where } from 'firebase/firestore'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  userId?: string
  senderId?: string
  receiverId?: string
  userName: string
  content: string
  createdAt: any
}

export default function AffiliateSupportPage() {
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  
  const [activeTab, setActiveTab] = useState<'community' | 'private'>('community')
  const [msgInput, setMsgInput] = useState('')
  const [isInCall, setIsInCall] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  
  const scrollRefComm = useRef<HTMLDivElement>(null)
  const scrollRefPriv = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const communityQuery = useMemoFirebase(() => 
    query(collection(db, 'community_messages'), orderBy('createdAt', 'asc'), limit(50)), 
  [db])
  const { data: communityMessages } = useCollection<Message>(communityQuery)

  // Sincronización bidireccional usando chatId consistente
  // Nota: El admin principal siempre tiene un ID fijo o podemos buscarlo. 
  // Para simplificar, usamos una consulta que busque mensajes donde el usuario es remitente o destinatario
  const privateQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'private_messages'),
      // Buscamos cualquier chatId que involucre al usuario actual
      where('chatId', '>=', ''), // Placeholder para asegurar orden
      orderBy('createdAt', 'asc'),
      limit(50)
    );
  }, [db, user]);
  
  // Filtrado local para mayor precisión (hasta que usemos or queries complejas)
  const { data: allPrivateMessages } = useCollection<Message>(privateQuery)
  const privateMessages = allPrivateMessages?.filter(m => 
    m.senderId === user?.uid || m.receiverId === user?.uid
  );

  const supportStatusRef = useMemoFirebase(() => doc(db, 'site_config', 'support_status'), [db]);
  const { data: supportStatus } = useDoc(supportStatusRef);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'community' && scrollRefComm.current) {
        scrollRefComm.current.scrollIntoView({ behavior: 'smooth' });
      } else if (activeTab === 'private' && scrollRefPriv.current) {
        scrollRefPriv.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [communityMessages, privateMessages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgInput.trim() || !user) return

    const content = msgInput.trim();
    const userName = `${user.firstName || "SOCIO"}`;
    setMsgInput('')

    if (activeTab === 'community') {
      addDocumentNonBlocking(collection(db, 'community_messages'), {
        userId: user.uid,
        userName,
        content,
        createdAt: serverTimestamp()
      })
    } else {
      // Usar el adminId del estado de soporte si existe, o el ID por defecto del admin
      const adminId = supportStatus?.adminId || 'admin_master_id'; 
      // Si no conocemos el adminId del servidor, usamos una lógica de chatId basado en el remitente/receptor
      // En este sistema el Admin siempre inicia el chat o responde.
      // Buscamos el adminId en el historial si no está en supportStatus
      const existingAdminId = privateMessages?.find(m => m.senderId !== user.uid)?.senderId || 'admin_master';

      addDocumentNonBlocking(collection(db, 'private_messages'), {
        senderId: user.uid,
        receiverId: existingAdminId,
        userName,
        content,
        chatId: `${existingAdminId}_${user.uid}`, // Consistent order: admin_user
        createdAt: serverTimestamp()
      });
    }
  }

  const joinCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsInCall(true);
    } catch (error) { 
      toast({ variant: "destructive", title: "Acceso Denegado", description: "Habilita el micrófono para hablar." });
    }
  }

  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsInCall(false);
  }

  const isIncomingCall = supportStatus?.isLive && (supportStatus.type === 'group' || supportStatus.targetUserId === user?.uid);

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-4 h-[calc(100vh-160px)] md:h-[calc(100vh-140px)] flex flex-col">
        
        <Tabs defaultValue="community" className="flex-1 flex flex-col" onValueChange={(v: any) => setActiveTab(v)}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <TabsList className="h-12 md:h-14 bg-white border border-slate-100 rounded-xl md:rounded-2xl p-1 shadow-sm w-full md:w-auto">
              <TabsTrigger value="community" className="flex-1 md:flex-none px-4 md:px-8 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest gap-2">
                <Users className="h-3.5 w-3.5 md:h-4 md:w-4" /> COMUNIDAD
              </TabsTrigger>
              <TabsTrigger value="private" className="flex-1 md:flex-none px-4 md:px-8 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest gap-2">
                <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4" /> SOPORTE
              </TabsTrigger>
            </TabsList>

            {isIncomingCall && !isInCall && (
              <Button onClick={joinCall} className="h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl bg-red-500 hover:bg-red-600 text-white gap-2 font-black text-[9px] md:text-[10px] uppercase animate-bounce shadow-xl shadow-red-200">
                <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 animate-pulse" /> LLAMADA: UNIRME
              </Button>
            )}
          </div>

          <TabsContent value="community" className="flex-1 mt-0 outline-none">
            <Card className="h-full border-none shadow-2xl rounded-2xl md:rounded-[3rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-4 md:p-6 shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-xl">
                    <Users className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xs md:text-sm font-headline font-black uppercase tracking-widest">Grupo Oficial Sync</CardTitle>
                    <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Centro de Ayuda</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/30 flex flex-col">
                <ScrollArea className="flex-1 p-4 md:p-8">
                  <div className="space-y-4 md:space-y-6">
                    {communityMessages?.map((msg) => (
                      <div key={msg.id} className={cn(
                        "flex flex-col max-w-[85%] md:max-w-[75%] animate-in fade-in slide-in-from-bottom-2",
                        msg.userId === user?.uid ? "ml-auto items-end" : "items-start"
                      )}>
                        <div className="flex items-center gap-2 mb-1 px-2">
                          <span className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-widest", msg.userName === "ADMINISTRADOR" ? "text-primary" : "text-slate-400")}>
                            {msg.userName}
                          </span>
                          {msg.userName === "ADMINISTRADOR" && <Crown className="h-3 w-3 text-primary" />}
                        </div>
                        <div className={cn(
                          "p-3 md:p-4 rounded-xl md:rounded-[1.5rem] text-[12px] md:text-[13px] font-bold shadow-sm leading-relaxed",
                          msg.userName === "ADMINISTRADOR" 
                            ? "bg-slate-900 text-white rounded-tl-none border border-primary/20" 
                            : (msg.userId === user?.uid ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100")
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRefComm} />
                  </div>
                </ScrollArea>
                <div className="p-4 md:p-6 bg-white border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl md:rounded-[2rem] ring-1 ring-slate-200">
                    <Input placeholder="Escribe..." value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="h-10 md:h-14 bg-transparent border-none shadow-none focus-visible:ring-0 flex-1 font-bold text-slate-800 px-4" />
                    <Button type="submit" size="icon" className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-full bg-primary shadow-xl shrink-0"><Send className="h-4 w-4 md:h-6 md:w-6 text-white" /></Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="private" className="flex-1 mt-0 outline-none">
            <Card className="h-full border-none shadow-2xl rounded-2xl md:rounded-[3rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-4 md:p-6 shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/10 flex items-center justify-center text-primary shadow-xl">
                    <ShieldCheck className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xs md:text-sm font-headline font-black uppercase tracking-widest">Chat Directo Admin</CardTitle>
                    <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Atención 1 a 1</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/30 flex flex-col">
                <ScrollArea className="flex-1 p-4 md:p-8">
                  <div className="space-y-4 md:space-y-6">
                    {privateMessages?.map((msg) => (
                      <div key={msg.id} className={cn(
                        "flex flex-col max-w-[85%] md:max-w-[75%] animate-in fade-in slide-in-from-bottom-2",
                        msg.senderId === user?.uid ? "ml-auto items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "p-3 md:p-4 rounded-xl md:rounded-[1.5rem] text-[12px] md:text-[13px] font-bold shadow-sm leading-relaxed",
                          msg.senderId === user?.uid 
                            ? "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10"
                            : "bg-slate-900 text-white rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRefPriv} />
                  </div>
                </ScrollArea>
                <div className="p-4 md:p-6 bg-white border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl md:rounded-[2rem] ring-1 ring-slate-200">
                    <Input placeholder="Mensaje privado..." value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="h-10 md:h-14 bg-transparent border-none shadow-none focus-visible:ring-0 flex-1 font-bold text-slate-800 px-4" />
                    <Button type="submit" size="icon" className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-full bg-slate-900 shadow-xl shrink-0"><Send className="h-4 w-4 md:h-6 md:w-6 text-white" /></Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {isInCall && (
          <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
            <Card className="max-w-sm w-full bg-slate-800 rounded-[3rem] md:rounded-[4rem] p-8 md:p-12 text-center border-4 border-primary/20 shadow-2xl">
              <div className="relative mb-8 mx-auto w-24 h-24 md:w-32 md:h-32">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative z-10 h-full w-full rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                  <Mic className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                </div>
              </div>
              <div className="space-y-2 md:space-y-4 mb-8 md:mb-12">
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Llamada en Vivo</h3>
                <Badge className="bg-red-500/20 text-red-500 border-none px-4 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase animate-pulse">AUDIO ACTIVO</Badge>
              </div>
              <div className="flex flex-col gap-4">
                <Button size="icon" variant="ghost" onClick={() => setIsMicMuted(!isMicMuted)} className={cn("mx-auto h-14 w-14 md:h-16 md:w-16 rounded-full border-2", isMicMuted ? "bg-red-500/20 border-red-500 text-red-500" : "bg-white/10 text-white")}>
                  {isMicMuted ? <MicOff className="h-6 w-6 md:h-8 md:w-8" /> : <Mic className="h-6 w-6 md:h-8 md:w-8" />}
                </Button>
                <Button onClick={endCall} variant="destructive" className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                  <PhoneOff className="h-5 w-5 md:h-6 md:w-6" /> COLGAR
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

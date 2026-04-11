
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
  X, 
  ShieldCheck, 
  Zap,
  Crown,
  AlertCircle,
  Bell,
  User,
  PhoneOff,
  MicOff,
  RefreshCw,
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
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null)
  
  const scrollRefComm = useRef<HTMLDivElement>(null)
  const scrollRefPriv = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const communityQuery = useMemoFirebase(() => 
    query(collection(db, 'community_messages'), orderBy('createdAt', 'asc'), limit(50)), 
  [db])
  const { data: communityMessages } = useCollection<Message>(communityQuery)

  const privateQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'private_messages'),
      where('chatId', 'in', [`affiliatesync0@gmail.com_${user.uid}`, `${user.uid}_affiliatesync0@gmail.com`]),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
  }, [db, user]);
  const { data: privateMessages } = useCollection<Message>(privateQuery)

  const supportStatusRef = useMemoFirebase(() => doc(db, 'site_config', 'support_status'), [db]);
  const { data: supportStatus } = useDoc(supportStatusRef);

  useEffect(() => {
    if (activeTab === 'community' && scrollRefComm.current) {
      scrollRefComm.current.scrollIntoView({ behavior: 'smooth' });
    } else if (activeTab === 'private' && scrollRefPriv.current) {
      scrollRefPriv.current.scrollIntoView({ behavior: 'smooth' });
    }
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
      addDocumentNonBlocking(collection(db, 'private_messages'), {
        senderId: user.uid,
        receiverId: 'affiliatesync0@gmail.com',
        userName,
        content,
        chatId: `${user.uid}_affiliatesync0@gmail.com`,
        createdAt: serverTimestamp()
      });
    }
  }

  const joinCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      setHasMicPermission(true);
      streamRef.current = stream;
      setIsInCall(true);
    } catch (error) { 
      setHasMicPermission(false);
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
      <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
        
        <Tabs defaultValue="community" className="flex-1 flex flex-col" onValueChange={(v: any) => setActiveTab(v)}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <TabsList className="h-14 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm">
              <TabsTrigger value="community" className="px-8 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Users className="h-4 w-4" /> COMUNIDAD SYNC
              </TabsTrigger>
              <TabsTrigger value="private" className="px-8 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                <ShieldCheck className="h-4 w-4" /> SOPORTE DIRECTO
              </TabsTrigger>
            </TabsList>

            {isIncomingCall && !isInCall && (
              <Button onClick={joinCall} className="h-12 px-6 rounded-2xl bg-red-500 hover:bg-red-600 text-white gap-3 font-black text-[10px] uppercase animate-bounce shadow-xl shadow-red-200">
                <Phone className="h-4 w-4 animate-pulse" /> LLAMADA EN CURSO: UNIRME
              </Button>
            )}
          </div>

          <TabsContent value="community" className="flex-1 mt-0 outline-none">
            <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-6 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-xl">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-headline font-black uppercase tracking-widest">Grupo de Apoyo Oficial</CardTitle>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Centro de Ayuda Sync Academy</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/30 flex flex-col">
                <ScrollArea className="flex-1 p-8">
                  <div className="space-y-6">
                    {communityMessages?.map((msg) => (
                      <div key={msg.id} className={cn(
                        "flex flex-col max-w-[75%] animate-in fade-in slide-in-from-bottom-2",
                        msg.userId === user?.uid ? "ml-auto items-end" : "items-start"
                      )}>
                        <div className="flex items-center gap-2 mb-1 px-2">
                          <span className={cn("text-[9px] font-black uppercase tracking-widest", msg.userName === "ADMINISTRADOR" ? "text-primary" : "text-slate-400")}>
                            {msg.userName}
                          </span>
                          {msg.userName === "ADMINISTRADOR" && <Crown className="h-3 w-3 text-primary" />}
                        </div>
                        <div className={cn(
                          "p-4 rounded-[1.5rem] text-[13px] font-bold shadow-sm leading-relaxed",
                          msg.userName === "ADMINISTRADOR" 
                            ? "bg-slate-900 text-white rounded-tl-none border border-primary/20" 
                            : (msg.userId === user?.uid ? "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10" : "bg-white text-slate-800 rounded-tl-none border border-slate-100")
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
                    <Button type="submit" size="icon" className="h-14 w-14 rounded-full bg-primary shadow-xl shrink-0"><Send className="h-6 w-6 text-white" /></Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="private" className="flex-1 mt-0 outline-none">
            <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-6 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary shadow-xl">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-headline font-black uppercase tracking-widest">Chat Privado con Administrador</CardTitle>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Atención personalizada 1 a 1</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/30 flex flex-col">
                <ScrollArea className="flex-1 p-8">
                  <div className="space-y-6">
                    {privateMessages?.map((msg) => (
                      <div key={msg.id} className={cn(
                        "flex flex-col max-w-[75%] animate-in fade-in slide-in-from-bottom-2",
                        (msg.userId === user?.uid || msg.senderId === user?.uid) ? "ml-auto items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "p-4 rounded-[1.5rem] text-[13px] font-bold shadow-sm leading-relaxed",
                          msg.userName === "ADMINISTRADOR" 
                            ? "bg-slate-900 text-white rounded-tl-none" 
                            : "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10"
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
                    <Input placeholder="Escribe un mensaje privado..." value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="h-14 bg-transparent border-none shadow-none focus-visible:ring-0 flex-1 font-bold text-slate-800 px-6" />
                    <Button type="submit" size="icon" className="h-14 w-14 rounded-full bg-slate-900 shadow-xl shrink-0"><Send className="h-6 w-6 text-white" /></Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {isInCall && (
          <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in duration-500">
            <Card className="max-w-md w-full bg-slate-800 rounded-[4rem] p-12 text-center border-4 border-primary/20 shadow-2xl">
              <div className="relative mb-10 mx-auto w-32 h-32">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative z-10 h-full w-full rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                  <User className="h-16 w-16 text-primary" />
                </div>
              </div>
              <div className="space-y-4 mb-12">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Llamada en Vivo</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Conectado con la administración</p>
                <Badge className="bg-red-500/20 text-red-500 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase animate-pulse">AUDIO ACTIVO</Badge>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex justify-center gap-4">
                  <Button size="icon" variant="ghost" onClick={() => setIsMicMuted(!isMicMuted)} className={cn("h-16 w-16 rounded-full border-2", isMicMuted ? "bg-red-500/20 border-red-500 text-red-500" : "bg-white/10 border-white/10 text-white")}>
                    {isMicMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                  </Button>
                </div>
                <Button onClick={endCall} variant="destructive" className="w-full h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                  <PhoneOff className="h-6 w-6" /> COLGAR LLAMADA
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

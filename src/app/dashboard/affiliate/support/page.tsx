
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
  Video, 
  Users, 
  Loader2, 
  Mic, 
  X, 
  ShieldCheck, 
  Zap,
  Camera,
  Crown,
  AlertCircle,
  Bell,
  VideoOff
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc } from '@/firebase'
import { collection, query, orderBy, limit, serverTimestamp, doc } from 'firebase/firestore'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  userId: string
  userName: string
  content: string
  createdAt: any
}

export default function AffiliateSupportPage() {
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  const [msgInput, setMsgInput] = useState('')
  const [isInCall, setIsInCall] = useState(false)
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastMessageId = useRef<string | null>(null)

  const messagesQuery = useMemoFirebase(() => 
    query(collection(db, 'community_messages'), orderBy('createdAt', 'asc'), limit(100)), 
  [db])
  const { data: messages, isLoading } = useCollection<Message>(messagesQuery)

  const supportStatusRef = useMemoFirebase(() => doc(db, 'site_config', 'support_status'), [db]);
  const { data: supportStatus } = useDoc(supportStatusRef);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Notificación de Videollamada en Vivo
  useEffect(() => {
    if (supportStatus?.isLive) {
      if (Notification.permission === "granted" && !isInCall) {
        new Notification("🚀 Mentoría en Vivo Activa", {
          body: "El administrador ha iniciado una sesión grupal. ¡Conéctate ahora!",
          icon: '/favicon.ico'
        });
      }
      toast({ title: "¡Sesión en Vivo!", description: "El administrador está transmitiendo ahora mismo." });
    }
  }, [supportStatus?.isLive]);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const latestMsg = messages[messages.length - 1];
    if (lastMessageId.current && lastMessageId.current !== latestMsg.id) {
      if (latestMsg.userId !== user?.uid && Notification.permission === "granted" && document.visibilityState === "hidden") {
        new Notification(`Sync Connect: ${latestMsg.userName}`, {
          body: latestMsg.content,
        });
      }
    }
    lastMessageId.current = latestMsg.id;
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgInput.trim() || !user) return
    const newMessage = {
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0]?.toUpperCase() || 'SOCIO',
      content: msgInput.trim(),
      createdAt: serverTimestamp()
    }
    setMsgInput('')
    addDocumentNonBlocking(collection(db, 'community_messages'), newMessage)
  }

  const startCall = async (type: 'voice' | 'video') => {
    setCallType(type)
    setIsInCall(true)
    setHasCameraPermission(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      setHasCameraPermission(true);
      if (videoRef.current && type === 'video') videoRef.current.srcObject = stream;
    } catch (error) { setHasCameraPermission(false); }
  }

  const endCall = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsInCall(false);
    setCallType(null);
  }

  return (
    <DashboardShell role="affiliate">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight">Sync <span className="text-primary">Support Hub</span></h1>
            {supportStatus?.isLive && (
              <Badge className="bg-red-500 text-white animate-pulse border-none px-4 py-1 rounded-full text-[10px] font-black uppercase">En Vivo Ahora</Badge>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={() => startCall('voice')} variant="outline" className="h-12 rounded-xl bg-white gap-2 font-bold text-xs">
              <Mic className="h-4 w-4 text-primary" /> Unirse a Voz
            </Button>
            <Button onClick={() => startCall('video')} className="h-12 rounded-xl bg-primary text-white gap-2 font-bold text-xs shadow-lg">
              <Video className="h-4 w-4" /> Videollamada
            </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          <Card className="flex-1 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
            <CardHeader className="bg-slate-900 text-white p-6 shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner"><Users className="h-5 w-5" /></div>
                <div>
                  <CardTitle className="text-sm font-headline font-black uppercase tracking-widest">Grupo de Apoyo Oficial</CardTitle>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Sincronización de Estrategias</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/50 flex flex-col">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {messages?.map((msg) => (
                    <div key={msg.id} className={cn("flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2", msg.userId === user?.uid ? "ml-auto items-end" : "items-start")}>
                      <div className="flex items-center gap-2 mb-1 px-2">
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", msg.userName === "ADMINISTRADOR" ? "text-primary" : "text-slate-400")}>{msg.userName}</span>
                        {msg.userName === "ADMINISTRADOR" && <Crown className="h-3 w-3 text-primary" />}
                      </div>
                      <div className={cn("p-4 rounded-[1.5rem] text-[13px] font-bold shadow-sm leading-relaxed", 
                        msg.userName === "ADMINISTRADOR" ? "bg-slate-900 text-white rounded-tl-none border border-primary/20" : (msg.userId === user?.uid ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100")
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
                  <Input placeholder="Escribe un mensaje..." value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="h-14 bg-transparent border-none shadow-none focus-visible:ring-0 flex-1 font-bold text-slate-800 px-6" />
                  <Button type="submit" size="icon" className="h-14 w-14 rounded-full bg-primary shadow-xl shrink-0"><Send className="h-6 w-6 text-white" /></Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {isInCall && (
            <Card className="w-[400px] border-none shadow-2xl rounded-[3rem] bg-slate-900 overflow-hidden flex flex-col animate-in slide-in-from-right-8 duration-500 ring-4 ring-primary/10">
              <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                <video ref={videoRef} className={cn("w-full h-full object-cover transition-opacity", hasCameraPermission ? "opacity-100" : "opacity-0")} autoPlay muted playsInline />
                {!hasCameraPermission && <div className="absolute inset-0 flex flex-col items-center justify-center p-10"><AlertCircle className="h-10 w-10 text-red-500 mb-4" /><p className="text-white font-black uppercase text-[10px]">Sin Acceso a Cámara</p></div>}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/10">
                  <Button onClick={endCall} variant="destructive" size="icon" className="h-12 w-12 rounded-full shadow-xl"><X className="h-6 w-6" /></Button>
                </div>
              </div>
              <div className="p-8 bg-slate-900 text-white">
                <h4 className="text-sm font-black uppercase tracking-tight">Sala de Apoyo Sync</h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Sesión Grupal</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

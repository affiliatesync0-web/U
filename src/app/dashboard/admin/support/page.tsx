
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
  Loader2, 
  Mic, 
  MicOff,
  Trash2,
  ShieldCheck,
  Flame,
  Camera,
  AlertCircle,
  VideoOff,
  Bell
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, query, orderBy, limit, serverTimestamp, doc, getDocs } from 'firebase/firestore'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  userId: string
  userName: string
  content: string
  createdAt: any
}

export default function AdminSupportPage() {
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  const [msgInput, setMsgInput] = useState('')
  const [isInCall, setIsInCall] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const lastMessageId = useRef<string | null>(null)

  const messagesQuery = useMemoFirebase(() => 
    query(collection(db, 'community_messages'), orderBy('createdAt', 'asc'), limit(100)), 
  [db])
  const { data: messages, isLoading } = useCollection<Message>(messagesQuery)

  // 1. Permisos de Notificación y Hardware
  useEffect(() => {
    const requestInitialPermissions = async () => {
      // Notificaciones
      if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        await Notification.requestPermission();
      }

      // Cámara/Micro
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setHasCameraPermission(true);
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (error) {
        console.error('Error inicial de permisos:', error);
        setHasCameraPermission(false);
      }
    };
    requestInitialPermissions();
  }, []);

  // 2. Notificar nuevos mensajes
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    const latestMsg = messages[messages.length - 1];
    
    if (lastMessageId.current && lastMessageId.current !== latestMsg.id) {
      if (latestMsg.userId !== user?.uid && Notification.permission === "granted" && document.visibilityState === "hidden") {
        new Notification(`Sync Connect: ${latestMsg.userName}`, {
          body: latestMsg.content,
          icon: '/favicon.ico'
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
      userName: "ADMINISTRADOR",
      content: msgInput.trim(),
      createdAt: serverTimestamp()
    }

    setMsgInput('')
    addDocumentNonBlocking(collection(db, 'community_messages'), newMessage)
  }

  const clearChat = async () => {
    if (!db) return;
    try {
      const snap = await getDocs(collection(db, 'community_messages'));
      snap.docs.forEach(d => deleteDocumentNonBlocking(doc(db, 'community_messages', d.id)));
      toast({ title: "Historial Limpiado" });
    } catch (e) {
      console.error(e);
    }
  }

  const startAdminCall = async () => {
    setIsInCall(true)
    setHasCameraPermission(null)
    
    if (Notification.permission === "granted") {
      new Notification("🚀 Sesión en Vivo Iniciada", {
        body: "El administrador ha iniciado una mentoría grupal. ¡Únete ahora!",
      });
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setHasCameraPermission(true);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e: any) {
      console.error('Error al iniciar llamada:', e);
      setHasCameraPermission(false);
    }
  }

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsInCall(false);
    setHasCameraPermission(null);
    setIsMicMuted(false);
    setIsVideoOff(false);
  }

  return (
    <DashboardShell role="admin">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight">Centro de <span className="text-primary">Mando Grupal</span></h1>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
              <Bell className="h-3 w-3 text-primary animate-pulse" /> Notificaciones activas para mensajes y llamadas.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={clearChat} variant="ghost" className="h-12 rounded-xl text-red-500 gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-red-50">
              <Trash2 className="h-4 w-4" /> LIMPIAR CHAT
            </Button>
            <Button onClick={startAdminCall} className="h-12 px-8 rounded-xl bg-slate-900 text-white gap-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200">
              <Video className="h-4 w-4 text-primary" /> INICIAR SESIÓN EN VIVO
            </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          <Card className="flex-1 border-none shadow-2xl rounded-[3.5rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
            <CardHeader className="bg-slate-900 text-white p-6 shrink-0 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white rotate-3">
                  <Flame className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-headline font-black uppercase tracking-widest">Chat Comunitario Sync</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/30 flex flex-col">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20" /></div>
                  ) : (
                    messages?.map((msg) => (
                      <div key={msg.id} className={cn(
                        "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2",
                        msg.userName === "ADMINISTRADOR" ? "ml-auto items-end" : "items-start"
                      )}>
                        <div className="flex items-center gap-2 mb-1 px-2">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-tighter",
                            msg.userName === "ADMINISTRADOR" ? "text-primary" : "text-slate-400"
                          )}>{msg.userName}</span>
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
                    ))
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-3 bg-slate-50 p-2 rounded-[2rem] ring-1 ring-slate-200">
                  <Input 
                    placeholder="Escribe un comunicado..." 
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

          {isInCall && (
            <Card className="w-[450px] border-none shadow-2xl rounded-[3.5rem] bg-black overflow-hidden flex flex-col relative ring-4 ring-primary/20 animate-in slide-in-from-right-4">
              <video 
                ref={videoRef} 
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-500", 
                  hasCameraPermission && !isVideoOff ? "opacity-100" : "opacity-0"
                )} 
                autoPlay 
                muted 
                playsInline 
              />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                {hasCameraPermission === false ? (
                  <div className="space-y-6 bg-black/80 backdrop-blur-md inset-0 absolute flex flex-col items-center justify-center p-10">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                    <p className="text-white font-black uppercase text-sm">Acceso Denegado</p>
                    <p className="text-slate-400 text-xs font-medium">Habilita cámara y micrófono en tu navegador.</p>
                    <Button onClick={startAdminCall} variant="outline" className="text-white border-white/20">REINTENTAR</Button>
                  </div>
                ) : isVideoOff && (
                  <VideoOff className="h-10 w-10 text-white/40" />
                )}
              </div>

              <div className="absolute bottom-10 left-0 right-0 px-10 flex flex-col gap-4">
                <div className="flex justify-center gap-4">
                   <Button size="icon" variant="ghost" onClick={toggleMic} className={cn("h-14 w-14 rounded-full backdrop-blur-xl border", isMicMuted ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white")}>
                     {isMicMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                   </Button>
                   <Button size="icon" variant="ghost" onClick={toggleVideo} className={cn("h-14 w-14 rounded-full backdrop-blur-xl border", isVideoOff ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white")}>
                     {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
                   </Button>
                </div>
                <Button onClick={endCall} className="w-full h-16 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest">
                  FINALIZAR SESIÓN
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

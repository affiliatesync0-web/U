
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
  Phone, 
  Video, 
  Users, 
  Loader2, 
  Mic, 
  X, 
  ShieldAlert, 
  Flame,
  Camera,
  Trash2,
  ShieldCheck,
  Zap
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const messagesQuery = useMemoFirebase(() => 
    query(collection(db, 'community_messages'), orderBy('createdAt', 'asc'), limit(100)), 
  [db])
  const { data: messages, isLoading } = useCollection<Message>(messagesQuery)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      toast({ title: "Historial Limpiado", description: "El chat grupal ha sido reseteado." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al limpiar chat" });
    }
  }

  const startAdminCall = async () => {
    setIsInCall(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      toast({ variant: "destructive", title: "Acceso denegado a multimedia" });
      setIsInCall(false);
    }
  }

  return (
    <DashboardShell role="admin">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight">Centro de <span className="text-primary">Mando Grupal</span></h1>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Modera la comunidad y supervisa la red en tiempo real.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={clearChat} variant="ghost" className="h-12 rounded-xl text-red-500 gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-red-50">
              <Trash2 className="h-4 w-4" /> LIMPIAR CHAT
            </Button>
            <Button onClick={startAdminCall} className="h-12 px-8 rounded-xl bg-slate-900 text-white gap-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-105 transition-all">
              <Video className="h-4 w-4 text-primary" /> INICIAR SESIÓN EN VIVO
            </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          <Card className="flex-1 border-none shadow-2xl rounded-[3.5rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
            <CardHeader className="bg-slate-900 text-white p-6 shrink-0 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white rotate-3 shadow-lg">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-headline font-black uppercase tracking-widest">Chat Comunitario Sync</CardTitle>
                    <p className="text-[9px] text-slate-500 font-bold uppercase flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Servidor Maestro Activo
                    </p>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                      +
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/30 flex flex-col">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary opacity-20" /></div>
                  ) : messages?.length === 0 ? (
                    <div className="text-center py-20 opacity-20 space-y-4">
                      <MessageSquare className="h-12 w-12 mx-auto" />
                      <p className="text-xs font-black uppercase tracking-widest">Sin mensajes previos</p>
                    </div>
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
                <form onSubmit={handleSendMessage} className="flex gap-3 bg-slate-50 p-2 rounded-[2rem] ring-1 ring-slate-200 focus-within:ring-primary/30 transition-all shadow-inner">
                  <Input 
                    placeholder="Escribe un comunicado o responde a los socios..." 
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
            <Card className="w-[450px] border-none shadow-2xl rounded-[3rem] bg-black overflow-hidden flex flex-col relative ring-4 ring-primary/20">
              <video ref={videoRef} className="w-full h-full object-cover opacity-60" autoPlay muted />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center animate-ping absolute" />
                <div className="relative z-10 text-center space-y-6">
                  <div className="h-20 w-20 bg-primary rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(255,93,27,0.5)]">
                    <Zap className="h-10 w-10 text-white fill-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.5em]">Live Admin Stream</p>
                    <p className="text-xs text-primary font-black uppercase">Transmitiendo a la Red</p>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-10 left-0 right-0 px-10">
                <Button onClick={() => setIsInCall(false)} className="w-full h-16 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest shadow-2xl border-none">
                  FINALIZAR TRANSMISIÓN
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

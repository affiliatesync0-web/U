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
  Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, query, orderBy, limit, serverTimestamp, doc, deleteDoc, getDocs } from 'firebase/firestore'
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
    const snap = await getDocs(collection(db, 'community_messages'));
    snap.docs.forEach(d => deleteDocumentNonBlocking(doc(db, 'community_messages', d.id)));
    toast({ title: "Chat Limpiado" });
  }

  const startAdminCall = async () => {
    setIsInCall(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      toast({ variant: "destructive", title: "Acceso denegado a multimedia" });
    }
  }

  return (
    <DashboardShell role="admin">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight">Centro de <span className="text-primary">Mando Grupal</span></h1>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Modera la comunidad y supervisa las llamadas
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={clearChat} variant="ghost" className="h-12 rounded-xl text-red-500 gap-2 font-bold text-[10px] uppercase tracking-widest">
              <Trash2 className="h-4 w-4" /> LIMPIAR HISTORIAL
            </Button>
            <Button onClick={startAdminCall} className="h-12 px-8 rounded-xl bg-slate-900 text-white gap-2 font-bold text-xs uppercase tracking-widest shadow-xl shadow-slate-200">
              <Video className="h-4 w-4 text-primary" /> INICIAR SALA MAESTRA
            </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          <Card className="flex-1 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
            <CardHeader className="bg-slate-900 text-white p-6 shrink-0 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white rotate-3 shadow-lg">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-headline font-black uppercase tracking-widest">Comunidad Sync (Modo Admin)</CardTitle>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Supervisión en Tiempo Real</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/5 flex flex-col">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {messages?.map((msg) => (
                    <div key={msg.id} className={cn(
                      "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2",
                      msg.userName === "ADMINISTRADOR" ? "ml-auto items-end" : "items-start"
                    )}>
                      <span className={cn(
                        "text-[9px] font-black uppercase mb-1 px-2",
                        msg.userName === "ADMINISTRADOR" ? "text-primary" : "text-slate-400"
                      )}>{msg.userName}</span>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm font-medium shadow-sm",
                        msg.userName === "ADMINISTRADOR" ? "bg-slate-900 text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Input 
                    placeholder="Escribir como administrador..." 
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    className="h-14 rounded-2xl px-6 bg-slate-50 border-none ring-1 ring-slate-200 flex-1 font-bold text-slate-800"
                  />
                  <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-slate-900 shadow-xl shrink-0 transition-transform active:scale-95">
                    <Send className="h-6 w-6 text-primary" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {isInCall && (
            <Card className="w-[450px] border-none shadow-2xl rounded-[3rem] bg-black overflow-hidden flex flex-col relative">
              <video ref={videoRef} className="w-full h-full object-cover opacity-60" autoPlay muted />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center animate-ping absolute" />
                <div className="relative z-10 text-center space-y-4">
                  <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center mx-auto shadow-2xl">
                    <Mic className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Trasmisión Maestra</p>
                </div>
              </div>
              <div className="absolute bottom-10 left-0 right-0 px-10">
                <Button onClick={() => setIsInCall(false)} className="w-full h-14 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest shadow-xl">
                  FINALIZAR REUNIÓN
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

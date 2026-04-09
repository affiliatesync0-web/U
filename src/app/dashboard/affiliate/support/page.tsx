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
  MicOff, 
  VideoOff, 
  X, 
  ShieldCheck, 
  Zap,
  Camera
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase'
import { collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore'
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
  const [hasCameraPermission, setHasCameraPermission] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const messagesQuery = useMemoFirebase(() => 
    query(collection(db, 'community_messages'), orderBy('createdAt', 'asc'), limit(50)), 
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
      userName: user.displayName || user.email?.split('@')[0] || 'Socio',
      content: msgInput.trim(),
      createdAt: serverTimestamp()
    }

    setMsgInput('')
    addDocumentNonBlocking(collection(db, 'community_messages'), newMessage)
  }

  const startCall = async (type: 'voice' | 'video') => {
    setCallType(type)
    setIsInCall(true)
    
    if (type === 'video') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acceso Denegado',
          description: 'Por favor habilita los permisos de cámara y micrófono.',
        });
      }
    }
  }

  const endCall = () => {
    setIsInCall(false)
    setCallType(null)
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }

  return (
    <DashboardShell role="affiliate">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight">Sync <span className="text-primary">Support Hub</span></h1>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Comunidad de socios activa 24/7
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => startCall('voice')} variant="outline" className="h-12 rounded-xl bg-white gap-2 font-bold text-xs uppercase tracking-widest border-slate-200">
              <Mic className="h-4 w-4 text-primary" /> Llamada Grupal
            </Button>
            <Button onClick={() => startCall('video')} className="h-12 rounded-xl bg-primary text-white gap-2 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
              <Video className="h-4 w-4" /> Videollamada
            </Button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Chat Container */}
          <Card className="flex-1 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
            <CardHeader className="bg-slate-900 text-white p-6 shrink-0 flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-headline font-black uppercase tracking-widest">Grupo de Apoyo Sync</CardTitle>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Chat de Crecimiento</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[8px] font-black uppercase tracking-widest">En Línea</div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/50 flex flex-col">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary opacity-20" /></div>
                  ) : messages?.map((msg) => (
                    <div key={msg.id} className={cn(
                      "flex flex-col max-w-[80%] animate-in fade-in slide-in-from-bottom-2",
                      msg.userId === user?.uid ? "ml-auto items-end" : "items-start"
                    )}>
                      <span className="text-[9px] font-black text-slate-400 uppercase mb-1 px-2">{msg.userName}</span>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm font-medium shadow-sm",
                        msg.userId === user?.uid ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
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
                    placeholder="Escribe un mensaje a la comunidad..." 
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    className="h-14 rounded-2xl px-6 bg-slate-50 border-none ring-1 ring-slate-200 flex-1 font-bold text-slate-800"
                  />
                  <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-primary shadow-xl shadow-primary/20 shrink-0">
                    <Send className="h-6 w-6 text-white" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Call / Video Interface */}
          {isInCall && (
            <Card className="w-[400px] border-none shadow-2xl rounded-[3rem] bg-slate-900 overflow-hidden flex flex-col animate-in slide-in-from-right-8 duration-500 ring-4 ring-primary/10">
              <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                {callType === 'video' ? (
                  <>
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted />
                    {!hasCameraPermission && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 space-y-4">
                        <Camera className="h-12 w-12 text-slate-700 animate-pulse" />
                        <p className="text-xs font-black text-slate-500 uppercase">Esperando acceso a cámara...</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                      <Mic className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-xs font-black text-primary uppercase tracking-[0.3em]">Llamada de Voz Activa</p>
                  </div>
                )}
                
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/10">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/20 text-white">
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button onClick={endCall} variant="destructive" size="icon" className="h-12 w-12 rounded-full shadow-xl">
                    <X className="h-6 w-6" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/20 text-white">
                    <VideoOff className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-8 bg-slate-900 text-white">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center font-black">S</div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">Sala de Soporte</h4>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Sincronización en curso</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

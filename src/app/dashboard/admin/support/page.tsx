
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
  Flame,
  Users,
  Search,
  ChevronRight,
  PhoneOff,
  MessageCircle,
  ArrowLeft,
  Crown,
  Clock,
  StopCircle,
  Play
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking, initializeFirebase } from '@/firebase'
import { collection, query, orderBy, limit, serverTimestamp, doc, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  userId?: string
  senderId?: string
  affiliateId?: string
  userName: string
  content: string
  type?: 'text' | 'audio'
  createdAt: any
  fromAdmin?: boolean
}

export default function AdminSupportPage() {
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  
  const [activeTab, setActiveTab] = useState<'community' | 'private'>('community')
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null)
  const [msgInput, setMsgInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)
  
  const [isInCall, setIsInCall] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
  const scrollRefComm = useRef<HTMLDivElement>(null)
  const scrollRefPriv = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const affiliatesQuery = useMemoFirebase(() => collection(db, 'affiliates'), [db])
  const { data: affiliates } = useCollection(affiliatesQuery)

  const communityQuery = useMemoFirebase(() => 
    query(collection(db, 'community_messages'), orderBy('createdAt', 'asc'), limit(100)), 
  [db])
  const { data: communityMessages } = useCollection<Message>(communityQuery)

  const privateQuery = useMemoFirebase(() => {
    if (!selectedAffiliate || !db) return null;
    return query(
      collection(db, 'private_messages'),
      where('affiliateId', '==', selectedAffiliate.id),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [db, selectedAffiliate]);
  
  const { data: privateMessages } = useCollection<Message>(privateQuery)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'community' && scrollRefComm.current) {
        scrollRefComm.current.scrollIntoView({ behavior: 'smooth' });
      } else if (activeTab === 'private' && scrollRefPriv.current) {
        scrollRefPriv.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [communityMessages, privateMessages, activeTab, selectedAffiliate, mobileShowChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgInput.trim() || !user || !db) return

    const content = msgInput.trim();
    setMsgInput('')

    if (activeTab === 'community') {
      addDocumentNonBlocking(collection(db, 'community_messages'), {
        userId: user.uid,
        userName: "ADMINISTRADOR",
        content,
        type: 'text',
        createdAt: serverTimestamp()
      })
    } else if (selectedAffiliate) {
      addDocumentNonBlocking(collection(db, 'private_messages'), {
        senderId: user.uid,
        affiliateId: selectedAffiliate.id,
        userName: "ADMINISTRADOR",
        content,
        type: 'text',
        fromAdmin: true,
        createdAt: serverTimestamp()
      });

      addDocumentNonBlocking(collection(db, 'notifications'), {
        userId: selectedAffiliate.id,
        title: '💬 Mensaje Directo Admin',
        message: content.substring(0, 60),
        type: 'system',
        createdAt: new Date().toISOString(),
        isRead: false,
        actionUrl: '/dashboard/affiliate/support'
      });
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo acceder al micrófono." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    if (!user || !db) return;
    if (activeTab === 'private' && !selectedAffiliate) return;

    setIsUploadingAudio(true);
    try {
      const { storage } = initializeFirebase();
      const audioRef = ref(storage, `support_audios/${Date.now()}.webm`);
      await uploadBytes(audioRef, blob);
      const downloadURL = await getDownloadURL(audioRef);

      if (activeTab === 'community') {
        addDocumentNonBlocking(collection(db, 'community_messages'), {
          userId: user.uid,
          userName: "ADMINISTRADOR",
          content: downloadURL,
          type: 'audio',
          createdAt: serverTimestamp()
        });
      } else {
        addDocumentNonBlocking(collection(db, 'private_messages'), {
          senderId: user.uid,
          affiliateId: selectedAffiliate.id,
          userName: "ADMINISTRADOR",
          content: downloadURL,
          type: 'audio',
          fromAdmin: true,
          createdAt: serverTimestamp()
        });
      }

      toast({ title: "Audio enviado" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error al subir audio" });
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const formatTime = (createdAt: any) => {
    if (!createdAt) return "";
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const startCall = async (targetId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsInCall(true);
      
      setDocumentNonBlocking(doc(db, 'site_config', 'support_status'), {
        isLive: true,
        startedAt: new Date().toISOString(),
        adminId: user?.uid,
        type: 'private',
        targetUserId: targetId
      }, { merge: true });

      toast({ title: "Iniciando Llamada de Voz", description: "El socio ha sido notificado." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error de Hardware", description: "Habilita el micrófono." });
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
      <div className="space-y-4 h-[calc(100vh-160px)] md:h-[calc(100vh-140px)] flex flex-col">
        
        <Tabs defaultValue="community" className="flex-1 flex flex-col" onValueChange={(v: any) => setActiveTab(v)}>
          <div className="flex items-center justify-between gap-4 mb-4">
            <TabsList className="h-12 md:h-14 bg-white border border-slate-100 rounded-xl md:rounded-2xl p-1 shadow-sm w-full md:w-auto">
              <TabsTrigger value="community" className="flex-1 md:flex-none px-4 md:px-8 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest gap-2">
                <Users className="h-3.5 w-3.5 md:h-4 md:w-4" /> COMUNIDAD
              </TabsTrigger>
              <TabsTrigger value="private" className="flex-1 md:flex-none px-4 md:px-8 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest gap-2">
                <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4" /> CHAT PRIVADO
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="community" className="flex-1 mt-0 outline-none h-full">
            <Card className="h-full border-none shadow-2xl rounded-2xl md:rounded-[3rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-4 md:p-6 shrink-0">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-xl">
                    <Flame className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xs md:text-sm font-headline font-black uppercase tracking-widest">Grupo Oficial Sync Academy</CardTitle>
                    <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Soporte Multicanal</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/30 flex flex-col">
                <ScrollArea className="flex-1 p-4 md:p-8">
                  <div className="space-y-4 md:space-y-6">
                    {communityMessages?.map((msg) => (
                      <div key={msg.id} className={cn(
                        "flex flex-col max-w-[85%] md:max-w-[75%] animate-in fade-in slide-in-from-bottom-2",
                        msg.userName === "ADMINISTRADOR" ? "ml-auto items-end" : "items-start"
                      )}>
                        <div className="flex items-center gap-2 mb-1 px-2">
                          <span className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-widest", msg.userName === "ADMINISTRADOR" ? "text-primary" : "text-slate-500")}>
                            {msg.userName}
                          </span>
                          {msg.userName === "ADMINISTRADOR" && <Crown className="h-3 w-3 text-primary" />}
                        </div>
                        <div className={cn(
                          "p-3 md:p-4 rounded-xl md:rounded-[1.5rem] text-[12px] md:text-[13px] font-bold shadow-sm leading-relaxed relative",
                          msg.userName === "ADMINISTRADOR" 
                            ? "bg-slate-900 text-white rounded-tr-none" 
                            : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                        )}>
                          {msg.type === 'audio' ? (
                            <audio src={msg.content} controls className="max-w-full h-8" />
                          ) : (
                            msg.content
                          )}
                          <div className={cn(
                            "mt-1 flex items-center gap-1 text-[8px] font-black uppercase opacity-40",
                            msg.userName === "ADMINISTRADOR" ? "justify-end text-white" : "justify-start text-slate-500"
                          )}>
                            <Clock className="h-2 w-2" /> {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRefComm} />
                  </div>
                </ScrollArea>
                <div className="p-4 md:p-6 bg-white border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-slate-100 p-1.5 rounded-2xl md:rounded-[2rem] ring-1 ring-slate-200">
                    <Button 
                      type="button" 
                      size="icon" 
                      className={cn(
                        "h-10 w-10 md:h-12 md:w-12 rounded-xl transition-all shrink-0",
                        isRecording ? "bg-red-500 animate-pulse text-white" : "bg-white text-slate-400 hover:bg-slate-50"
                      )}
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                    >
                      {isRecording ? <StopCircle className="h-5 w-5" /> : (isUploadingAudio ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />)}
                    </Button>
                    <Input 
                      placeholder={isRecording ? "Grabando audio..." : "Escribe al grupo..."} 
                      value={msgInput} 
                      onChange={(e) => setMsgInput(e.target.value)} 
                      disabled={isRecording}
                      className="h-10 md:h-14 bg-transparent border-none shadow-none focus-visible:ring-0 flex-1 font-bold text-slate-800 px-4" 
                    />
                    <Button type="submit" size="icon" className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-full bg-slate-900 shadow-xl shrink-0 transition-all active:scale-90" disabled={isRecording}>
                      <Send className="h-4 w-4 md:h-6 md:w-6 text-white" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="private" className="flex-1 mt-0 outline-none h-full">
            <div className="flex gap-4 h-full relative">
              <Card className={cn(
                "w-full md:w-80 shrink-0 border-none shadow-xl rounded-2xl md:rounded-[2.5rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100",
                mobileShowChat ? "hidden md:flex" : "flex"
              )}>
                <CardHeader className="p-4 md:p-6 space-y-4 bg-slate-50 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Buscar afiliado..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-10 bg-white border-none ring-1 ring-slate-200 pl-10 rounded-xl text-xs font-bold"
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-2 space-y-1">
                      {filteredAffiliates.map((aff) => (
                        <button 
                          key={aff.id}
                          onClick={() => { setSelectedAffiliate(aff); setMobileShowChat(true); }}
                          className={cn(
                            "w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl transition-all",
                            selectedAffiliate?.id === aff.id ? "bg-slate-900 text-white shadow-xl" : "hover:bg-slate-50 text-slate-600"
                          )}
                        >
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs", selectedAffiliate?.id === aff.id ? "bg-primary text-white shadow-lg rotate-3" : "bg-slate-200 text-slate-500")}>
                            {aff.firstName?.charAt(0)}
                          </div>
                          <div className="flex-1 text-left truncate">
                            <p className="text-xs font-black uppercase truncate">{aff.firstName} {aff.lastName}</p>
                            <p className="text-[8px] font-bold opacity-50 uppercase tracking-widest">{aff.status}</p>
                          </div>
                          {selectedAffiliate?.id === aff.id && <ChevronRight className="h-4 w-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className={cn(
                "flex-1 border-none shadow-2xl rounded-2xl md:rounded-[3rem] bg-white overflow-hidden flex flex-col h-full ring-1 ring-slate-100",
                !mobileShowChat ? "hidden md:flex" : "flex"
              )}>
                {!selectedAffiliate ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50/50">
                    <MessageCircle className="h-12 w-12 text-slate-200 mb-4" />
                    <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest leading-none">Selecciona un socio para<br/>iniciar conversación</h3>
                  </div>
                ) : (
                  <>
                    <CardHeader className="bg-slate-900 text-white p-4 md:p-6 shrink-0 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3 md:gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden text-white h-8 w-8" onClick={() => setMobileShowChat(false)}>
                          <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-xl font-black text-xs md:text-sm">
                          {selectedAffiliate.firstName?.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-xs md:text-sm font-headline font-black uppercase tracking-widest truncate max-w-[120px] md:max-w-none">
                            {selectedAffiliate.firstName} {selectedAffiliate.lastName}
                          </CardTitle>
                          <p className="text-[8px] md:text-[9px] text-primary font-black uppercase tracking-widest">Conversación Privada</p>
                        </div>
                      </div>
                      <Button onClick={() => startCall(selectedAffiliate.id)} size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                        <Phone className="h-4 w-4 md:h-5 md:w-5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50/30 flex flex-col">
                      <ScrollArea className="flex-1 p-4 md:p-8">
                        <div className="space-y-4 md:space-y-6">
                          {privateMessages?.map((msg) => (
                            <div key={msg.id} className={cn(
                              "flex flex-col max-w-[85%] md:max-w-[75%] animate-in fade-in slide-in-from-bottom-2",
                              msg.fromAdmin ? "ml-auto items-end" : "items-start"
                            )}>
                              <div className="flex items-center gap-2 mb-1 px-2">
                                <span className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-widest", msg.fromAdmin ? "text-primary" : "text-slate-500")}>
                                  {msg.userName}
                                </span>
                                {msg.fromAdmin && <Crown className="h-3 w-3 text-primary" />}
                              </div>
                              <div className={cn(
                                "p-3 md:p-4 rounded-xl md:rounded-[1.5rem] text-[12px] md:text-[13px] font-bold shadow-sm leading-relaxed relative",
                                msg.fromAdmin 
                                  ? "bg-slate-900 text-white rounded-tr-none" 
                                  : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                              )}>
                                {msg.type === 'audio' ? (
                                  <audio src={msg.content} controls className="max-w-full h-8" />
                                ) : (
                                  msg.content
                                )}
                                <div className={cn(
                                  "mt-1 flex items-center gap-1 text-[8px] font-black uppercase opacity-40",
                                  msg.fromAdmin ? "justify-end text-white" : "justify-start text-slate-500"
                                )}>
                                  <Clock className="h-2 w-2" /> {formatTime(msg.createdAt)}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div ref={scrollRefPriv} />
                        </div>
                      </ScrollArea>
                      <div className="p-4 md:p-6 bg-white border-t">
                        <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-slate-100 p-1.5 rounded-2xl md:rounded-[2rem] ring-1 ring-slate-200">
                          <Button 
                            type="button" 
                            size="icon" 
                            className={cn(
                              "h-10 w-10 md:h-12 md:w-12 rounded-xl transition-all shrink-0",
                              isRecording ? "bg-red-500 animate-pulse text-white" : "bg-white text-slate-400 hover:bg-slate-50"
                            )}
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                          >
                            {isRecording ? <StopCircle className="h-5 w-5" /> : (isUploadingAudio ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />)}
                          </Button>
                          <input type="hidden" name="dummy" />
                          <Input 
                            placeholder={isRecording ? "Grabando audio..." : "Escribe un mensaje privado..."} 
                            value={msgInput} 
                            onChange={(e) => setMsgInput(e.target.value)} 
                            disabled={isRecording}
                            className="h-10 md:h-12 bg-transparent border-none shadow-none focus-visible:ring-0 flex-1 font-bold text-slate-800 px-4" 
                          />
                          <Button type="submit" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-900 shadow-xl shrink-0 transition-all active:scale-90" disabled={isRecording}>
                            <Send className="h-4 w-4 md:h-5 md:w-5 text-white" />
                          </Button>
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
          <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
            <Card className="w-full max-sm:max-w-xs border-none shadow-2xl rounded-[3rem] bg-slate-800 p-8 md:p-12 text-center ring-4 ring-primary/20">
              <div className="relative mb-8 mx-auto w-24 h-24 md:w-32 md:h-32">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative z-10 h-full w-full rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30">
                  <Mic className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                </div>
              </div>
              <div className="space-y-2 md:space-y-4 mb-8 md:mb-12">
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Llamada de Voz</h3>
                <Badge className="bg-red-500/20 text-red-500 border-none px-4 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase animate-pulse">MICRÓFONO ABIERTO</Badge>
              </div>
              <div className="flex flex-col gap-4">
                <Button size="icon" variant="ghost" onClick={() => setIsMicMuted(!isMicMuted)} className={cn("mx-auto h-14 w-14 md:h-16 md:w-16 rounded-full border-2 transition-all", isMicMuted ? "bg-red-500/20 border-red-500 text-red-500" : "bg-white/10 text-white hover:bg-white/20")}>
                  {isMicMuted ? <MicOff className="h-6 w-6 md:h-8 md:w-8" /> : <Mic className="h-6 w-6 md:h-8 md:w-8" />}
                </Button>
                <Button onClick={endCall} className="w-full h-14 md:h-16 rounded-xl md:rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3">
                  <PhoneOff className="h-5 w-5 md:h-6 md:w-6" /> FINALIZAR LLAMADA
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

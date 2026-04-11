
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
  Flame,
  StopCircle,
  CheckCheck
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc, initializeFirebase } from '@/firebase'
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

export default function AffiliateSupportPage() {
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  
  const [activeTab, setActiveTab] = useState<'community' | 'private'>('community')
  const [msgInput, setMsgInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
  const scrollRefComm = useRef<HTMLDivElement>(null)
  const scrollRefPriv = useRef<HTMLDivElement>(null)

  const ADMIN_EMAIL = 'affiliatesync0@gmail.com';

  const communityQuery = useMemoFirebase(() => 
    query(collection(db, 'community_messages'), orderBy('createdAt', 'asc'), limit(100)), 
  [db])
  const { data: communityMessages } = useCollection<Message>(communityQuery)

  const affiliateRef = useMemoFirebase(() => (db && user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(affiliateRef);

  const privateQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, 'private_messages'),
      where('affiliateId', '==', user.uid),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [db, user]);
  
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
  }, [communityMessages, privateMessages, activeTab]);

  const formatTime = (createdAt: any) => {
    if (!createdAt) return "Ahora";
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgInput.trim() || !user || !db) return

    const content = msgInput.trim();
    const isAdmin = user.email?.toLowerCase().trim() === ADMIN_EMAIL;
    let nameToUse = isAdmin ? "ADMINISTRADOR" : (profile?.firstName ? `${profile.firstName} ${profile.lastName}`.trim().toUpperCase() : "SOCIO");

    setMsgInput('')

    if (activeTab === 'community') {
      addDocumentNonBlocking(collection(db, 'community_messages'), {
        userId: user.uid,
        userName: nameToUse,
        content,
        type: 'text',
        createdAt: serverTimestamp()
      })
    } else {
      addDocumentNonBlocking(collection(db, 'private_messages'), {
        senderId: user.uid,
        affiliateId: user.uid,
        userName: nameToUse,
        content,
        type: 'text',
        fromAdmin: isAdmin,
        createdAt: serverTimestamp()
      });
    }
  }

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

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
        if (audioBlob.size > 500) {
          await uploadAudio(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({ variant: "destructive", title: "Error Micrófono", description: "Por favor, concede permisos de audio." });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    if (!user || !db) return;
    setIsUploadingAudio(true);
    try {
      const { storage } = initializeFirebase();
      const audioRef = ref(storage, `support_audios/aff_${user.uid}_${Date.now()}.webm`);
      
      const uploadResult = await uploadBytes(audioRef, blob);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const isAdmin = user.email?.toLowerCase().trim() === ADMIN_EMAIL;
      let nameToUse = isAdmin ? "ADMINISTRADOR" : (profile?.firstName ? `${profile.firstName} ${profile.lastName}`.trim().toUpperCase() : "SOCIO");

      if (activeTab === 'community') {
        await addDocumentNonBlocking(collection(db, 'community_messages'), {
          userId: user.uid,
          userName: nameToUse,
          content: downloadURL,
          type: 'audio',
          createdAt: serverTimestamp()
        });
      } else {
        await addDocumentNonBlocking(collection(db, 'private_messages'), {
          senderId: user.uid,
          affiliateId: user.uid,
          userName: nameToUse,
          content: downloadURL,
          type: 'audio',
          fromAdmin: isAdmin,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Audio error:", err);
      toast({ variant: "destructive", title: "Fallo al enviar audio" });
    } finally {
      setIsUploadingAudio(false);
    }
  };

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-4 h-[calc(100vh-160px)] md:h-[calc(100vh-140px)] flex flex-col">
        <Tabs defaultValue="community" className="flex-1 flex flex-col" onValueChange={(v: any) => setActiveTab(v)}>
          <div className="mb-4">
            <TabsList className="h-12 md:h-14 bg-white border border-slate-100 rounded-xl md:rounded-2xl p-1 shadow-sm w-full md:w-auto">
              <TabsTrigger value="community" className="flex-1 md:flex-none px-4 md:px-8 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-[#075E54] data-[state=active]:text-white">
                <Users className="h-3.5 w-3.5 md:h-4 md:w-4" /> COMUNIDAD
              </TabsTrigger>
              <TabsTrigger value="private" className="flex-1 md:flex-none px-4 md:px-8 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-[#075E54] data-[state=active]:text-white">
                <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4" /> CHAT ADMIN
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="community" className="flex-1 mt-0 h-full">
            <Card className="h-full border-none shadow-2xl rounded-2xl md:rounded-[3rem] bg-[#E5DDD5] overflow-hidden flex flex-col ring-1 ring-slate-100">
              <CardHeader className="bg-[#075E54] text-white p-4 md:p-6 shrink-0 border-b border-white/10">
                <div className="flex items-center gap-3"><div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/10 flex items-center justify-center text-white shadow-xl"><Flame className="h-5 w-5 md:h-6 md:w-6" /></div><div><CardTitle className="text-xs md:text-sm font-headline font-black uppercase tracking-widest text-white">Grupo Oficial Sync Academy</CardTitle><p className="text-[8px] md:text-[9px] text-white/60 font-bold uppercase tracking-widest mt-0.5">Comunidad Live</p></div></div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col">
                <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none" />
                <ScrollArea className="flex-1 p-4 md:p-8 relative z-10">
                  <div className="space-y-4">
                    {communityMessages?.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[75%]", msg.userId === user?.uid ? "ml-auto items-end" : "items-start")}>
                        <div className="flex items-center gap-2 mb-1 px-2">
                          <span className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-widest", msg.userName === "ADMINISTRADOR" ? "text-[#075E54]" : "text-slate-500")}>{msg.userName}</span>
                          {msg.userName === "ADMINISTRADOR" && <Crown className="h-3 w-3 text-amber-500" />}
                        </div>
                        <div className={cn("p-3 md:p-4 rounded-[1.2rem] text-[13px] font-medium shadow-sm leading-relaxed relative", 
                          msg.userName === "ADMINISTRADOR" ? "bg-white text-slate-800 rounded-tl-none border border-amber-100" : 
                          (msg.userId === user?.uid ? "bg-[#DCF8C6] text-slate-800 rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100")
                        )}>
                          {msg.type === 'audio' ? <audio src={msg.content} controls className="max-w-full h-8" /> : msg.content}
                          <div className={cn("mt-1 flex items-center gap-1 text-[8px] font-black uppercase opacity-40 justify-end", msg.userId === user?.uid ? "text-slate-600" : "text-slate-500")}>
                            {formatTime(msg.createdAt)}
                            {msg.userId === user?.uid && <CheckCheck className="h-2.5 w-2.5 text-blue-500 ml-1" />}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRefComm} />
                  </div>
                </ScrollArea>
                <ChatInputArea 
                  msgInput={msgInput} 
                  setMsgInput={setMsgInput} 
                  onSend={handleSendMessage} 
                  isRecording={isRecording} 
                  isUploading={isUploadingAudio} 
                  onMicClick={toggleRecording} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="private" className="flex-1 mt-0 h-full">
            <Card className="h-full border-none shadow-2xl rounded-2xl md:rounded-[3rem] bg-[#E5DDD5] overflow-hidden flex flex-col ring-1 ring-slate-100">
              <CardHeader className="bg-[#075E54] text-white p-4 md:p-6 shrink-0 border-b border-white/10">
                <div className="flex items-center gap-3"><div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/10 flex items-center justify-center text-white shadow-xl"><ShieldCheck className="h-5 w-5" /></div><div><CardTitle className="text-xs md:text-sm font-headline font-black uppercase tracking-widest text-white">Chat Directo con Admin</CardTitle><p className="text-[8px] md:text-[9px] text-white/60 font-bold uppercase tracking-widest mt-0.5">Soporte Privado</p></div></div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col">
                <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none" />
                <ScrollArea className="flex-1 p-4 md:p-8 relative z-10">
                  <div className="space-y-4">
                    {privateMessages?.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[75%]", msg.fromAdmin ? "items-start" : "ml-auto items-end")}>
                        <div className="flex items-center gap-2 mb-1 px-2">
                          <span className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-widest", msg.fromAdmin ? "text-[#075E54]" : "text-slate-500")}>{msg.userName}</span>
                          {msg.fromAdmin && <Crown className="h-3 w-3 text-amber-500" />}
                        </div>
                        <div className={cn("p-3 md:p-4 rounded-[1.2rem] text-[13px] font-medium shadow-sm leading-relaxed relative", 
                          msg.fromAdmin ? "bg-white text-slate-800 rounded-tl-none border border-slate-100" : "bg-[#DCF8C6] text-slate-800 rounded-tr-none"
                        )}>
                          {msg.type === 'audio' ? <audio src={msg.content} controls className="max-w-full h-8" /> : msg.content}
                          <div className={cn("mt-1 flex items-center gap-1 text-[8px] font-black uppercase opacity-40 justify-end", msg.fromAdmin ? "text-slate-500" : "text-slate-600")}>
                            {formatTime(msg.createdAt)}
                            {!msg.fromAdmin && <CheckCheck className="h-2.5 w-2.5 text-blue-500 ml-1" />}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRefPriv} />
                  </div>
                </ScrollArea>
                <ChatInputArea 
                  msgInput={msgInput} 
                  setMsgInput={setMsgInput} 
                  onSend={handleSendMessage} 
                  isRecording={isRecording} 
                  isUploading={isUploadingAudio} 
                  onMicClick={toggleRecording} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}

function ChatInputArea({ msgInput, setMsgInput, onSend, isRecording, isUploading, onMicClick }: any) {
  return (
    <div className="p-3 md:p-4 bg-[#F0F2F5] shrink-0 border-t">
      <form onSubmit={onSend} className="flex gap-2 items-center">
        <Button 
          type="button" 
          size="icon" 
          className={cn("h-12 w-12 rounded-full transition-all shrink-0 shadow-sm", isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white text-slate-500 hover:bg-slate-50")}
          onClick={onMicClick}
        >
          {isRecording ? <StopCircle className="h-6 w-6" /> : (isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mic className="h-6 w-6" />)}
        </Button>
        
        <div className="flex-1 relative bg-white rounded-[1.5rem] shadow-sm ring-1 ring-slate-200">
          <Input 
            placeholder={isRecording ? "Grabando..." : (isUploading ? "Enviando..." : "Escribe un mensaje...")} 
            value={msgInput} 
            onChange={(e) => setMsgInput(e.target.value)} 
            disabled={isRecording || isUploading} 
            className="h-12 bg-transparent border-none shadow-none focus-visible:ring-0 font-medium text-slate-800 px-6 pr-14" 
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1 top-1 h-10 w-10 rounded-full bg-transparent hover:bg-slate-50 text-[#075E54] shadow-none shrink-0" 
            disabled={!msgInput.trim() || isRecording || isUploading}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}

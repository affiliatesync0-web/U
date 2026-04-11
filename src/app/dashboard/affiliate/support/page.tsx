
"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Send, 
  Users, 
  ShieldCheck, 
  Crown,
  Flame,
  CheckCheck,
  MessageCircle,
  Loader2
} from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc } from '@/firebase'
import { collection, query, limit, doc, where, orderBy, onSnapshot } from 'firebase/firestore'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  userId?: string
  senderId?: string
  affiliateId?: string
  userName: string
  content: string
  type: 'text'
  createdAt: string
  fromAdmin?: boolean
}

export default function AffiliateSupportPage() {
  const db = useFirestore()
  const { user } = useUser()
  
  const [activeTab, setActiveTab] = useState<'community' | 'private'>('community')
  const [msgInput, setMsgInput] = useState('')
  
  const scrollRefComm = useRef<HTMLDivElement>(null)
  const scrollRefPriv = useRef<HTMLDivElement>(null)

  // 1. Perfil del Afiliado
  const affiliateRef = useMemoFirebase(() => (db && user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(affiliateRef);

  // 2. Chat de Comunidad
  const communityQuery = useMemoFirebase(() => 
    query(collection(db, 'community_messages'), orderBy('createdAt', 'asc'), limit(150)), 
  [db])
  const { data: communityMessages = [] } = useCollection<Message>(communityQuery)

  // 3. Chat Privado con Admin
  const privateQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, 'private_messages'),
      where('affiliateId', '==', user.uid),
      orderBy('createdAt', 'asc'),
      limit(150)
    );
  }, [db, user]);
  
  const { data: privateMessages = [] } = useCollection<Message>(privateQuery)

  // Notificaciones y Permisos
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    const now = new Date().toISOString();
    
    // Notificaciones Comunidad
    const unsubComm = onSnapshot(collection(db, 'community_messages'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const msg = change.doc.data() as Message;
          if (msg.createdAt > now && msg.userId !== user?.uid) {
            if (Notification.permission === "granted") {
              new Notification(`Comunidad Sync: ${msg.userName}`, { body: msg.content });
            }
          }
        }
      });
    });

    // Notificaciones Privadas
    const unsubPriv = onSnapshot(collection(db, 'private_messages'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const msg = change.doc.data() as Message;
          if (msg.createdAt > now && msg.affiliateId === user?.uid && msg.fromAdmin) {
            if (Notification.permission === "granted") {
              new Notification(`Mensaje del Administrador`, { body: msg.content });
            }
          }
        }
      });
    });

    return () => {
      unsubComm();
      unsubPriv();
    };
  }, [db, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'community' && scrollRefComm.current) {
        scrollRefComm.current.scrollIntoView({ behavior: 'smooth' });
      } else if (activeTab === 'private' && scrollRefPriv.current) {
        scrollRefPriv.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [communityMessages?.length, privateMessages?.length, activeTab]);

  const formatTime = (createdAt: any) => {
    if (!createdAt) return "";
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return "";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgInput.trim() || !user || !db) return

    const content = msgInput.trim();
    const userName = profile?.firstName ? `${profile.firstName} ${profile.lastName}`.trim().toUpperCase() : "SOCIO";
    const timestamp = new Date().toISOString();

    setMsgInput('')

    if (activeTab === 'community') {
      addDocumentNonBlocking(collection(db, 'community_messages'), {
        userId: user.uid,
        userName: userName,
        content,
        type: 'text',
        createdAt: timestamp
      })
    } else {
      addDocumentNonBlocking(collection(db, 'private_messages'), {
        senderId: user.uid,
        affiliateId: user.uid,
        userName: userName,
        content,
        type: 'text',
        fromAdmin: false,
        createdAt: timestamp
      });
    }
  }

  return (
    <DashboardShell role="affiliate">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
        <Tabs defaultValue="community" className="flex-1 flex flex-col" onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="h-14 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm w-full md:w-fit self-center">
            <TabsTrigger value="community" className="flex-1 md:w-48 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-[#075E54] data-[state=active]:text-white">
              <Users className="h-4 w-4" /> COMUNIDAD
            </TabsTrigger>
            <TabsTrigger value="private" className="flex-1 md:w-48 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-[#075E54] data-[state=active]:text-white">
              <ShieldCheck className="h-4 w-4" /> CHAT ADMIN
            </TabsTrigger>
          </TabsList>

          <TabsContent value="community" className="flex-1 mt-4 overflow-hidden">
            <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-[#E5DDD5] overflow-hidden flex flex-col relative ring-1 ring-slate-100">
              <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none" />
              
              <CardHeader className="bg-[#075E54] text-white p-6 shrink-0 z-10 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white shadow-xl"><Flame className="h-6 w-6" /></div>
                  <div>
                    <CardTitle className="text-sm font-headline font-black uppercase tracking-widest text-white">Grupo Oficial Sync Academy</CardTitle>
                    <p className="text-[9px] text-white/60 font-black uppercase tracking-widest">Chat en tiempo real</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col z-10">
                <ScrollArea className="flex-1 p-6 md:p-10">
                  <div className="space-y-4">
                    {communityMessages?.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", msg.userId === user?.uid ? "ml-auto items-end" : "items-start")}>
                        <div className="flex items-center gap-2 mb-1 px-3">
                          <span className={cn("text-[9px] font-black uppercase tracking-widest", msg.userName === "ADMINISTRADOR" ? "text-[#075E54]" : "text-slate-500")}>{msg.userName}</span>
                          {msg.userName === "ADMINISTRADOR" && <Crown className="h-3 w-3 text-amber-500" />}
                        </div>
                        <div className={cn("p-4 rounded-[1.5rem] text-[13px] font-medium shadow-sm leading-relaxed relative", 
                          msg.userId === user?.uid ? "bg-[#DCF8C6] text-slate-800 rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                        )}>
                          {msg.content}
                          <div className={cn("mt-1.5 flex items-center gap-1 text-[8px] font-black uppercase opacity-40 justify-end", msg.userId === user?.uid ? "text-slate-600" : "text-slate-500")}>
                            {formatTime(msg.createdAt)}
                            {msg.userId === user?.uid && <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRefComm} />
                  </div>
                </ScrollArea>
                
                <div className="p-4 bg-[#F0F2F5] shrink-0 border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
                    <Input 
                      placeholder="Escribe un mensaje..." 
                      value={msgInput} 
                      onChange={(e) => setMsgInput(e.target.value)} 
                      className="h-14 bg-white border-none shadow-sm rounded-2xl px-6 font-medium text-slate-800 focus-visible:ring-1 focus-visible:ring-[#075E54]" 
                    />
                    <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-[#075E54] hover:bg-[#054c44] text-white shadow-xl shrink-0" disabled={!msgInput.trim()}>
                      <Send className="h-6 w-6" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="private" className="flex-1 mt-4 overflow-hidden">
            <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-[#E5DDD5] overflow-hidden flex flex-col relative ring-1 ring-slate-100">
              <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none" />
              
              <CardHeader className="bg-[#075E54] text-white p-6 shrink-0 z-10 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white shadow-xl"><ShieldCheck className="h-6 w-6" /></div>
                  <div>
                    <CardTitle className="text-sm font-headline font-black uppercase tracking-widest text-white">Soporte Privado Admin</CardTitle>
                    <p className="text-[9px] text-white/60 font-black uppercase tracking-widest">Conversación Directa</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col z-10">
                <ScrollArea className="flex-1 p-6 md:p-10">
                  <div className="space-y-4">
                    {privateMessages?.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", !msg.fromAdmin ? "ml-auto items-end" : "items-start")}>
                        <div className="flex items-center gap-2 mb-1 px-3">
                          <span className={cn("text-[9px] font-black uppercase tracking-widest", msg.fromAdmin ? "text-[#075E54]" : "text-slate-500")}>
                            {msg.fromAdmin ? "ADMINISTRADOR" : "YO"}
                          </span>
                          {msg.fromAdmin && <Crown className="h-3 w-3 text-amber-500" />}
                        </div>
                        <div className={cn("p-4 rounded-[1.5rem] text-[13px] font-medium shadow-sm leading-relaxed relative", 
                          !msg.fromAdmin ? "bg-[#DCF8C6] text-slate-800 rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                        )}>
                          {msg.content}
                          <div className={cn("mt-1.5 flex items-center gap-1 text-[8px] font-black uppercase opacity-40 justify-end", !msg.fromAdmin ? "text-slate-600" : "text-slate-500")}>
                            {formatTime(msg.createdAt)}
                            {!msg.fromAdmin && <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRefPriv} />
                  </div>
                </ScrollArea>
                
                <div className="p-4 bg-[#F0F2F5] shrink-0 border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
                    <Input 
                      placeholder="Escribe un mensaje privado al administrador..." 
                      value={msgInput} 
                      onChange={(e) => setMsgInput(e.target.value)} 
                      className="h-14 bg-white border-none shadow-sm rounded-2xl px-6 font-medium text-slate-800 focus-visible:ring-1 focus-visible:ring-[#075E54]" 
                    />
                    <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-[#075E54] hover:bg-[#054c44] text-white shadow-xl shrink-0" disabled={!msgInput.trim()}>
                      <Send className="h-6 w-6" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}

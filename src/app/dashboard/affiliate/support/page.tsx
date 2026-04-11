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
  Loader2,
  Trash2,
  Pencil,
  X,
  Check,
  MoreVertical
} from 'lucide-react'
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  useDoc,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking
} from '@/firebase'
import { collection, query, doc, where, onSnapshot } from 'firebase/firestore'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  edited?: boolean
}

export default function AffiliateSupportPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState<'community' | 'private'>('community')
  const [msgInput, setMsgInput] = useState('')
  const [editingMsgId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const scrollRefComm = useRef<HTMLDivElement>(null)
  const scrollRefPriv = useRef<HTMLDivElement>(null)

  const affiliateRef = useMemoFirebase(() => (db && user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(affiliateRef);

  const communityQuery = useMemoFirebase(() => collection(db, 'community_messages'), [db])
  const { data: commData } = useCollection<Message>(communityQuery)
  const communityMessages = (commData || [])
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    .slice(-200)

  const privateQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(collection(db, 'private_messages'), where('affiliateId', '==', user.uid));
  }, [db, user]);
  
  const { data: privData } = useCollection<Message>(privateQuery)
  const privateMessages = (privData || [])
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    .slice(-200)

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (!db || !user) return;
    const now = new Date().toISOString();
    
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

    return () => unsubComm();
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

  const formatDateTime = (createdAt: any) => {
    if (!createdAt) return '--:--';
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return '--:--';
      
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      
      if (isToday) {
        return `Hoy, ${timeStr}`;
      } else {
        return `${date.toLocaleDateString([], { day: '2-digit', month: 'short' })}, ${timeStr}`;
      }
    } catch (e) { 
      return '--:--';
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

  const handleDeleteMessage = (id: string, isPrivate: boolean) => {
    const coll = isPrivate ? 'private_messages' : 'community_messages';
    deleteDocumentNonBlocking(doc(db, coll, id));
    toast({ title: "Mensaje eliminado" });
  };

  const handleSaveEdit = (isPrivate: boolean) => {
    if (!editingMsgId || !editContent.trim()) return;
    const coll = isPrivate ? 'private_messages' : 'community_messages';
    updateDocumentNonBlocking(doc(db, coll, editingMsgId), { content: editContent.trim(), edited: true });
    setEditingId(null);
    setEditContent('');
  };

  return (
    <DashboardShell role="affiliate">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
        <Tabs defaultValue="community" className="flex-1 flex flex-col" onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="h-14 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm w-fit self-center">
            <TabsTrigger value="community" className="w-48 rounded-xl font-black text-[10px] uppercase gap-2 data-[state=active]:bg-[#075E54] data-[state=active]:text-white">
              <Users className="h-4 w-4" /> COMUNIDAD
            </TabsTrigger>
            <TabsTrigger value="private" className="w-48 rounded-xl font-black text-[10px] uppercase gap-2 data-[state=active]:bg-[#075E54] data-[state=active]:text-white">
              <ShieldCheck className="h-4 w-4" /> CHAT ADMIN
            </TabsTrigger>
          </TabsList>

          <TabsContent value="community" className="flex-1 mt-4 overflow-hidden">
            <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-[#E5DDD5] overflow-hidden flex flex-col relative">
              <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none" />
              <CardHeader className="bg-[#075E54] text-white p-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center"><Flame className="h-6 w-6" /></div>
                  <div><CardTitle className="text-sm font-black uppercase tracking-widest">Grupo Oficial Sync Academy</CardTitle></div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col z-10">
                <ScrollArea className="flex-1 p-6 md:p-10">
                  <div className="space-y-4">
                    {communityMessages.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.userId === user?.uid ? "ml-auto items-end" : "items-start")}>
                        <div className="flex items-center gap-2 mb-1 px-3">
                          <span className="text-[9px] font-black uppercase text-slate-500">{msg.userName}</span>
                          {msg.userName === "ADMINISTRADOR" && <Crown className="h-3 w-3 text-amber-500" />}
                        </div>
                        <div className={cn("group p-4 rounded-[1.5rem] text-[13px] font-medium shadow-sm relative", 
                          msg.userId === user?.uid ? "bg-[#DCF8C6] rounded-tr-none" : "bg-white rounded-tl-none border"
                        )}>
                          {editingMsgId === msg.id ? (
                            <div className="flex flex-col gap-2">
                              <Input value={editContent} onChange={e => setEditContent(e.target.value)} className="h-10 text-[16px]" autoFocus />
                              <div className="flex justify-end gap-2">
                                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(false)}><Check className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {msg.content}
                              <div className="mt-1.5 flex items-center gap-1 text-[8px] font-black uppercase opacity-40 justify-end">
                                {msg.edited && "(editado) "}{formatDateTime(msg.createdAt)}
                                {msg.userId === user?.uid && <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />}
                              </div>
                              {msg.userId === user?.uid && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-3 w-3" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent><DropdownMenuItem onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}>Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDeleteMessage(msg.id, false)} className="text-red-600">Borrar</DropdownMenuItem></DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRefComm} />
                  </div>
                </ScrollArea>
                <div className="p-4 bg-[#F0F2F5] shrink-0 border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
                    <Input placeholder="Escribe un mensaje..." value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="h-14 bg-white border-none shadow-sm rounded-2xl px-6 font-medium text-[16px]" />
                    <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-[#075E54] text-white shadow-xl shrink-0"><Send className="h-6 w-6" /></Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="private" className="flex-1 mt-4 overflow-hidden">
            <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-[#E5DDD5] overflow-hidden flex flex-col relative">
              <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none" />
              <CardHeader className="bg-[#075E54] text-white p-6 shrink-0 z-10"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center"><ShieldCheck className="h-6 w-6" /></div><div><CardTitle className="text-sm font-black uppercase">Soporte Privado Admin</CardTitle></div></div></CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col z-10">
                <ScrollArea className="flex-1 p-6 md:p-10">
                  <div className="space-y-4">
                    {privateMessages.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[85%]", !msg.fromAdmin ? "ml-auto items-end" : "items-start")}>
                        <div className={cn("group p-4 rounded-[1.5rem] text-[13px] font-medium shadow-sm relative", 
                          !msg.fromAdmin ? "bg-[#DCF8C6] rounded-tr-none" : "bg-white rounded-tl-none border"
                        )}>
                          {editingMsgId === msg.id ? (
                            <div className="flex flex-col gap-2">
                              <Input value={editContent} onChange={e => setEditContent(e.target.value)} className="h-10 text-[16px]" autoFocus />
                              <div className="flex justify-end gap-2">
                                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(true)}><Check className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {msg.content}
                              <div className="mt-1.5 flex items-center gap-1 text-[8px] font-black uppercase opacity-40 justify-end">
                                {msg.edited && "(editado) "}{formatDateTime(msg.createdAt)}
                                {!msg.fromAdmin && <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />}
                              </div>
                              {!msg.fromAdmin && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="h-3 w-3" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent><DropdownMenuItem onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}>Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDeleteMessage(msg.id, true)} className="text-red-600">Borrar</DropdownMenuItem></DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={scrollRefPriv} />
                  </div>
                </ScrollArea>
                <div className="p-4 bg-[#F0F2F5] shrink-0 border-t">
                  <form onSubmit={handleSendMessage} className="flex gap-3 max-w-4xl mx-auto">
                    <Input placeholder="Escribe al administrador..." value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="h-14 bg-white border-none shadow-sm rounded-2xl px-6 font-medium text-[16px]" />
                    <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-[#075E54] text-white shadow-xl shrink-0"><Send className="h-6 w-6" /></Button>
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

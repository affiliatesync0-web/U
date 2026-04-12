
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
  Search,
  ArrowLeft,
  CheckCheck,
  Flame,
  MessageCircle,
  Loader2,
  X,
  Check,
  MoreVertical,
  Bell
} from 'lucide-react'
import { 
  useFirestore, 
  useUser, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  deleteDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from '@/firebase'
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore'
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

export default function AdminSupportPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState<'community' | 'private'>('community')
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null)
  const [msgInput, setMsgInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)
  
  const [editingMsgId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [mounted, setMounted] = useState(false);

  const scrollRefComm = useRef<HTMLDivElement>(null)
  const scrollRefPriv = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const affiliatesQuery = useMemoFirebase(() => collection(db, 'affiliates'), [db])
  const { data: affiliatesData } = useCollection(affiliatesQuery)
  const affiliates = affiliatesData || []

  const communityQuery = useMemoFirebase(() => collection(db, 'community_messages'), [db])
  const { data: commData } = useCollection<Message>(communityQuery)
  const communityMessages = [...(commData || [])]
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    .slice(-200)

  const privateQuery = useMemoFirebase(() => {
    if (!selectedAffiliate || !db) return null;
    return query(collection(db, 'private_messages'), where('affiliateId', '==', selectedAffiliate.id));
  }, [db, selectedAffiliate]);
  
  const { data: privData } = useCollection<Message>(privateQuery)
  const privateMessages = [...(privData || [])]
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    .slice(-200)

  useEffect(() => {
    if (mounted && db) {
      const now = new Date().toISOString();
      const unsubComm = onSnapshot(collection(db, 'community_messages'), (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            const msg = change.doc.data() as Message;
            if (msg.createdAt > now && msg.userName !== "ADMINISTRADOR") {
              if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                try {
                  new Notification(`Sync Grupo: ${msg.userName}`, { body: msg.content });
                } catch (e) {}
              }
            }
          }
        });
      });
      return () => unsubComm();
    }
  }, [mounted, db]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'community' && scrollRefComm.current) {
        scrollRefComm.current.scrollIntoView({ behavior: 'smooth' });
      } else if (activeTab === 'private' && scrollRefPriv.current) {
        scrollRefPriv.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [communityMessages.length, privateMessages.length, activeTab, selectedAffiliate]);

  const formatDateTime = (createdAt: any) => {
    if (!createdAt) return '--:--';
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return '--:--';
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      if (isToday) return `Hoy, ${timeStr}`;
      const day = date.getDate().toString().padStart(2, '0');
      const month = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][date.getMonth()];
      return `${day} ${month}, ${timeStr}`;
    } catch (e) { return '--:--'; }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgInput.trim() || !user || !db) return
    const content = msgInput.trim();
    const timestamp = new Date().toISOString();
    setMsgInput('')

    if (activeTab === 'community') {
      addDocumentNonBlocking(collection(db, 'community_messages'), {
        userId: user.uid,
        userName: "ADMINISTRADOR",
        content,
        type: 'text',
        createdAt: timestamp
      })
    } else if (selectedAffiliate) {
      addDocumentNonBlocking(collection(db, 'private_messages'), {
        senderId: user.uid,
        affiliateId: selectedAffiliate.id,
        userName: "ADMINISTRADOR",
        content,
        type: 'text',
        fromAdmin: true,
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

  const handleRequestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
    }
  };

  const filteredAffiliates = affiliates.filter(a => 
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <DashboardShell role="admin">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
        <div className="flex justify-between items-center px-4">
          <Tabs defaultValue="community" className="flex-1 flex flex-col" onValueChange={(v: any) => setActiveTab(v)}>
            <TabsList className="h-14 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm w-fit self-center">
              <TabsTrigger value="community" className="w-48 rounded-xl font-black text-[10px] uppercase gap-2 data-[state=active]:bg-[#075E54] data-[state=active]:text-white">
                <Users className="h-4 w-4" /> GRUPO OFICIAL
              </TabsTrigger>
              <TabsTrigger value="private" className="w-48 rounded-xl font-black text-[10px] uppercase gap-2 data-[state=active]:bg-[#075E54] data-[state=active]:text-white">
                <MessageCircle className="h-4 w-4" /> CHATS PRIVADOS
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {notifPermission !== 'granted' && (
            <Button onClick={handleRequestPermission} variant="outline" className="h-10 px-4 rounded-xl border-amber-200 text-amber-600 text-[9px] font-black uppercase">
              <Bell className="mr-2 h-3 w-3" /> Activar Alertas
            </Button>
          )}
        </div>

        <div className="flex-1 mt-4 overflow-hidden">
          {activeTab === 'community' ? (
            <Card className="h-full border-none shadow-2xl rounded-[3.5rem] bg-[#E5DDD5] overflow-hidden flex flex-col relative">
              <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none" />
              <CardHeader className="bg-[#075E54] text-white p-6 shrink-0 z-10 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center"><Flame className="h-6 w-6" /></div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Soporte Maestro Sync</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col z-10">
                <ScrollArea className="flex-1 p-6 md:p-10">
                  <div className="space-y-4">
                    {communityMessages.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.userName === "ADMINISTRADOR" ? "ml-auto items-end" : "items-start")}>
                        <span className="text-[9px] font-black uppercase px-3 mb-1 text-slate-500">{msg.userName}</span>
                        <div className={cn("group p-4 rounded-[1.5rem] text-[13px] font-medium shadow-sm relative", 
                          msg.userName === "ADMINISTRADOR" ? "bg-[#DCF8C6] rounded-tr-none" : "bg-white rounded-tl-none border"
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
                                {msg.userName === "ADMINISTRADOR" && <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />}
                              </div>
                              {msg.userName === "ADMINISTRADOR" && (
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
          ) : (
            <div className="flex flex-col md:flex-row gap-4 h-full">
              <Card className={cn("w-full md:w-80 shrink-0 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col", mobileShowChat ? "hidden md:flex" : "flex")}>
                <CardHeader className="p-6 bg-slate-50 border-b">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Buscar socio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-12 bg-white border-none ring-1 ring-slate-200 pl-11 rounded-xl text-[16px] font-black uppercase" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-2 space-y-1">
                      {filteredAffiliates.map((aff) => (
                        <button key={aff.id} onClick={() => { setSelectedAffiliate(aff); setMobileShowChat(true); }} className={cn("w-full flex items-center gap-4 p-4 rounded-2xl transition-all", selectedAffiliate?.id === aff.id ? "bg-[#075E54]/10" : "hover:bg-slate-50")}>
                          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center font-black text-xs shadow-md shrink-0", selectedAffiliate?.id === aff.id ? "bg-[#075E54] text-white" : "bg-slate-200 text-slate-500")}>{aff.firstName?.charAt(0)}</div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-[11px] font-black text-slate-800 uppercase truncate">{aff.firstName} {aff.lastName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">Conversación Privada</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className={cn("flex-1 border-none shadow-2xl rounded-[3rem] bg-[#E5DDD5] overflow-hidden flex flex-col relative", !mobileShowChat ? "hidden md:flex" : "flex")}>
                {!selectedAffiliate ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white/50">
                    <MessageCircle className="h-16 w-16 text-slate-400 mb-4" />
                    <h3 className="text-xl font-black text-slate-500 uppercase">Canal Privado</h3>
                    <p className="text-sm text-slate-400 mt-2">Selecciona un socio para comenzar.</p>
                  </div>
                ) : (
                  <>
                    <CardHeader className="bg-[#075E54] text-white p-6 shrink-0 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden text-white" onClick={() => setMobileShowChat(false)}><ArrowLeft /></Button>
                        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center font-black">{selectedAffiliate.firstName?.charAt(0)}</div>
                        <div>
                          <CardTitle className="text-sm font-black uppercase">{selectedAffiliate.firstName} {selectedAffiliate.lastName}</CardTitle>
                          <p className="text-[9px] text-white/60 font-black">Socio Activo</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col z-10">
                      <ScrollArea className="flex-1 p-6 md:p-10">
                        <div className="space-y-4">
                          {privateMessages.map((msg) => (
                            <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.fromAdmin ? "ml-auto items-end" : "items-start")}>
                              <div className={cn("group p-4 rounded-[1.5rem] text-[13px] font-medium shadow-sm relative", 
                                msg.fromAdmin ? "bg-[#DCF8C6] rounded-tr-none" : "bg-white rounded-tl-none border"
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
                                      {msg.fromAdmin && <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />}
                                    </div>
                                    {msg.fromAdmin && (
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
                        <form onSubmit={handleSendMessage} className="flex gap-3">
                          <Input placeholder="Escribe un mensaje privado..." value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="h-14 bg-white border-none shadow-sm rounded-2xl px-6 font-medium text-[16px]" />
                          <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-[#075E54] text-white shadow-xl shrink-0"><Send className="h-6 w-6" /></Button>
                        </form>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

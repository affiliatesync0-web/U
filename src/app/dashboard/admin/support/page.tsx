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
  Crown,
  CheckCheck,
  Flame,
  MessageCircle,
  Loader2,
  Trash2,
  Pencil,
  X,
  Check,
  MoreVertical,
  Eraser
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
import { collection, query, where, onSnapshot, doc, getDocs } from 'firebase/firestore'
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

  const scrollRefComm = useRef<HTMLDivElement>(null)
  const scrollRefPriv = useRef<HTMLDivElement>(null)

  // 1. Cargar Afiliados
  const affiliatesQuery = useMemoFirebase(() => collection(db, 'affiliates'), [db])
  const { data: affiliatesData, isLoading: loadingAffs } = useCollection(affiliatesQuery)
  const affiliates = affiliatesData || []

  // 2. Chat de Comunidad (Ordenamiento local para evitar error de índices)
  const communityQuery = useMemoFirebase(() => collection(db, 'community_messages'), [db])
  const { data: commData } = useCollection<Message>(communityQuery)
  const communityMessages = (commData || [])
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    .slice(-200)

  // 3. Chat Privado (Ordenamiento local para evitar error de índices)
  const privateQuery = useMemoFirebase(() => {
    if (!selectedAffiliate || !db) return null;
    return query(collection(db, 'private_messages'), where('affiliateId', '==', selectedAffiliate.id));
  }, [db, selectedAffiliate]);
  
  const { data: privData } = useCollection<Message>(privateQuery)
  const privateMessages = (privData || [])
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    .slice(-200)

  // Notificaciones Estilo WhatsApp
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    if (!db) return;
    const now = new Date().toISOString();
    
    const unsubComm = onSnapshot(collection(db, 'community_messages'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const msg = change.doc.data() as Message;
          if (msg.createdAt > now && msg.userName !== "ADMINISTRADOR") {
            if (Notification.permission === "granted") {
              new Notification(`Sync Grupo: ${msg.userName}`, { body: msg.content });
            }
          }
        }
      });
    });

    const unsubPriv = onSnapshot(collection(db, 'private_messages'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const msg = change.doc.data() as Message;
          if (msg.createdAt > now && !msg.fromAdmin) {
            if (Notification.permission === "granted") {
              new Notification(`Sync Privado: ${msg.userName}`, { body: msg.content });
            }
          }
        }
      });
    });

    return () => { unsubComm(); unsubPriv(); };
  }, [db]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'community' && scrollRefComm.current) {
        scrollRefComm.current.scrollIntoView({ behavior: 'smooth' });
      } else if (activeTab === 'private' && scrollRefPriv.current) {
        scrollRefPriv.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [communityMessages?.length, privateMessages?.length, activeTab, selectedAffiliate, mobileShowChat]);

  // FUNCIÓN DE HORA BLINDADA (12 Horas AM/PM)
  const formatTime = (createdAt: any) => {
    if (!createdAt) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) { 
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
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

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = (isPrivate: boolean) => {
    if (!editingMsgId || !editContent.trim()) return;
    const coll = isPrivate ? 'private_messages' : 'community_messages';
    updateDocumentNonBlocking(doc(db, coll, editingMsgId), {
      content: editContent.trim(),
      edited: true
    });
    setEditingId(null);
    setEditContent('');
    toast({ title: "Mensaje actualizado" });
  };

  const handleClearChat = async (isPrivate: boolean) => {
    if (!confirm("¿Seguro que quieres borrar TODOS los mensajes de este chat?")) return;
    
    const collName = isPrivate ? 'private_messages' : 'community_messages';
    let q;
    if (isPrivate && selectedAffiliate) {
      q = query(collection(db, collName), where('affiliateId', '==', selectedAffiliate.id));
    } else {
      q = collection(db, collName);
    }
    
    const snap = await getDocs(q);
    snap.docs.forEach(d => deleteDocumentNonBlocking(doc(db, collName, d.id)));
    toast({ title: "Chat vaciado" });
  };

  const filteredAffiliates = affiliates.filter(a => 
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell role="admin">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
        <Tabs defaultValue="community" className="flex-1 flex flex-col" onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="h-14 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm w-full md:w-fit self-center">
            <TabsTrigger value="community" className="flex-1 md:w-48 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-[#075E54] data-[state=active]:text-white">
              <Users className="h-4 w-4" /> GRUPO OFICIAL
            </TabsTrigger>
            <TabsTrigger value="private" className="flex-1 md:w-48 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 data-[state=active]:bg-[#075E54] data-[state=active]:text-white">
              <MessageCircle className="h-4 w-4" /> CHATS PRIVADOS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="community" className="flex-1 mt-4 overflow-hidden">
            <Card className="h-full border-none shadow-2xl rounded-[3rem] bg-[#E5DDD5] overflow-hidden flex flex-col relative ring-1 ring-slate-100">
              <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none" />
              
              <CardHeader className="bg-[#075E54] text-white p-6 shrink-0 z-10 border-b border-white/10 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white shadow-xl"><Flame className="h-6 w-6" /></div>
                  <div>
                    <CardTitle className="text-sm font-headline font-black uppercase tracking-widest text-white">Soporte Maestro Sync</CardTitle>
                    <p className="text-[9px] text-white/60 font-black uppercase tracking-widest">Grupo Oficial</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-white/40 hover:text-white" onClick={() => handleClearChat(false)} title="Vaciar Grupo">
                  <Eraser className="h-5 w-5" />
                </Button>
              </CardHeader>

              <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col z-10">
                <ScrollArea className="flex-1 p-6 md:p-10">
                  <div className="space-y-4">
                    {communityMessages?.map((msg) => (
                      <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", msg.userName === "ADMINISTRADOR" ? "ml-auto items-end" : "items-start")}>
                        <div className="flex items-center gap-2 mb-1 px-3">
                          <span className={cn("text-[9px] font-black uppercase tracking-widest", msg.userName === "ADMINISTRADOR" ? "text-[#075E54]" : "text-slate-500")}>{msg.userName}</span>
                          {msg.userName === "ADMINISTRADOR" && <Crown className="h-3 w-3 text-amber-500" />}
                        </div>
                        <div className={cn("group p-4 rounded-[1.5rem] text-[13px] font-medium shadow-sm leading-relaxed relative", 
                          msg.userName === "ADMINISTRADOR" ? "bg-[#DCF8C6] text-slate-800 rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                        )}>
                          {editingMsgId === msg.id ? (
                            <div className="flex flex-col gap-2">
                              <Input value={editContent} onChange={e => setEditContent(e.target.value)} className="h-10 text-xs bg-white/50" autoFocus />
                              <div className="flex justify-end gap-2">
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={() => handleSaveEdit(false)}><Check className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {msg.content}
                              <div className={cn("mt-1.5 flex items-center gap-1 text-[8px] font-black uppercase opacity-40 justify-end", msg.userName === "ADMINISTRADOR" ? "text-slate-600" : "text-slate-500")}>
                                {msg.edited && "(editado) "}{formatTime(msg.createdAt)}
                                {msg.userName === "ADMINISTRADOR" && <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />}
                              </div>
                              {msg.userName === "ADMINISTRADOR" && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 p-0"><MoreVertical className="h-3 w-3" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl">
                                      <DropdownMenuItem onClick={() => startEdit(msg)} className="text-[10px] font-black uppercase"><Pencil className="h-3 w-3 mr-2" /> Editar</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id, false)} className="text-[10px] font-black uppercase text-red-600"><Trash2 className="h-3 w-3 mr-2" /> Borrar</DropdownMenuItem>
                                    </DropdownMenuContent>
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
                    <Input placeholder="Escribe un mensaje..." value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="h-14 bg-white border-none shadow-sm rounded-2xl px-6 font-medium focus-visible:ring-[#075E54]" />
                    <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-[#075E54] hover:bg-[#054c44] text-white shadow-xl shrink-0" disabled={!msgInput.trim()}><Send className="h-6 w-6" /></Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="private" className="flex-1 mt-4 overflow-hidden h-full">
            <div className="flex flex-col md:flex-row gap-4 h-full">
              <Card className={cn("w-full md:w-80 shrink-0 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100", mobileShowChat ? "hidden md:flex" : "flex")}>
                <CardHeader className="p-6 bg-slate-50 border-b">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Buscar socio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-12 bg-white border-none ring-1 ring-slate-200 pl-11 rounded-xl text-[11px] font-black uppercase" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-2 space-y-1">
                      {loadingAffs ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                      ) : filteredAffiliates.map((aff) => (
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

              <Card className={cn("flex-1 border-none shadow-2xl rounded-[3rem] bg-[#E5DDD5] overflow-hidden flex flex-col h-full relative ring-1 ring-slate-100", !mobileShowChat ? "hidden md:flex" : "flex")}>
                <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none" />
                
                {!selectedAffiliate ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white/50 backdrop-blur-sm z-10">
                    <div className="h-32 w-32 bg-slate-200 rounded-full flex items-center justify-center mb-8 shadow-inner"><MessageCircle className="h-16 w-16 text-slate-400" /></div>
                    <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest leading-none">Canal Privado</h3>
                    <p className="text-sm font-medium text-slate-400 mt-4 max-w-xs">Selecciona un socio para comenzar.</p>
                  </div>
                ) : (
                  <>
                    <CardHeader className="bg-[#075E54] text-white p-6 shrink-0 flex items-center justify-between border-b border-white/10 z-10">
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden text-white h-10 w-10 rounded-full" onClick={() => setMobileShowChat(false)}><ArrowLeft className="h-6 w-6" /></Button>
                        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center text-white shadow-xl font-black text-sm">{selectedAffiliate.firstName?.charAt(0)}</div>
                        <div>
                          <CardTitle className="text-sm font-headline font-black uppercase tracking-widest text-white">{selectedAffiliate.firstName} {selectedAffiliate.lastName}</CardTitle>
                          <p className="text-[9px] text-white/60 font-black uppercase">Socio Activo</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-white/40 hover:text-white" onClick={() => handleClearChat(true)} title="Vaciar Chat">
                        <Eraser className="h-5 w-5" />
                      </Button>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col z-10">
                      <ScrollArea className="flex-1 p-6 md:p-10">
                        <div className="space-y-4">
                          {privateMessages?.map((msg) => (
                            <div key={msg.id} className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", msg.fromAdmin ? "ml-auto items-end" : "items-start")}>
                              <div className={cn("group p-4 rounded-[1.5rem] text-[13px] font-medium shadow-sm leading-relaxed relative", 
                                msg.fromAdmin ? "bg-[#DCF8C6] text-slate-800 rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                              )}>
                                {editingMsgId === msg.id ? (
                                  <div className="flex flex-col gap-2">
                                    <Input value={editContent} onChange={e => setEditContent(e.target.value)} className="h-10 text-xs bg-white/50" autoFocus />
                                    <div className="flex justify-end gap-2">
                                      <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                                      <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={() => handleSaveEdit(true)}><Check className="h-3 w-3" /></Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {msg.content}
                                    <div className={cn("mt-1.5 flex items-center gap-1 text-[8px] font-black uppercase opacity-40 justify-end", msg.fromAdmin ? "text-slate-600" : "text-slate-500")}>
                                      {msg.edited && "(editado) "}{formatTime(msg.createdAt)}
                                      {msg.fromAdmin && <CheckCheck className="h-3 w-3 text-blue-500 ml-1" />}
                                    </div>
                                    {msg.fromAdmin && (
                                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 p-0"><MoreVertical className="h-3 w-3" /></Button></DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="rounded-xl">
                                            <DropdownMenuItem onClick={() => startEdit(msg)} className="text-[10px] font-black uppercase"><Pencil className="h-3 w-3 mr-2" /> Editar</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id, true)} className="text-[10px] font-black uppercase text-red-600"><Trash2 className="h-3 w-3 mr-2" /> Borrar</DropdownMenuItem>
                                          </DropdownMenuContent>
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
                          <Input placeholder="Escribe un mensaje privado..." value={msgInput} onChange={(e) => setMsgInput(e.target.value)} className="h-14 bg-white border-none shadow-sm rounded-2xl px-6 font-medium focus-visible:ring-[#075E54]" />
                          <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-[#075E54] hover:bg-[#054c44] text-white shadow-xl shrink-0" disabled={!msgInput.trim()}><Send className="h-6 w-6" /></Button>
                        </form>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}

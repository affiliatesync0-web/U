"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Send, 
  Users, 
  Search,
  ArrowLeft,
  CheckCheck,
  MessageCircle,
  Loader2,
  X,
  Check,
  MoreVertical,
  Bell,
  Mail,
  Inbox,
  User,
  ShieldCheck
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
import { Badge } from '@/components/ui/badge'

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

export default function AdminInboxPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null)
  const [msgInput, setMsgInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [mobileShowChat, setMobileShowChat] = useState(false)
  
  const [editingMsgId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [mounted, setMounted] = useState(false);

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

  const privateQuery = useMemoFirebase(() => {
    if (!selectedAffiliate || !db) return null;
    return query(collection(db, 'private_messages'), where('affiliateId', '==', selectedAffiliate.id));
  }, [db, selectedAffiliate]);
  
  const { data: privData, isLoading: messagesLoading } = useCollection<Message>(privateQuery)
  const privateMessages = [...(privData || [])]
    .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRefPriv.current) {
        scrollRefPriv.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [privateMessages.length, selectedAffiliate]);

  const formatDateTime = (createdAt: any) => {
    if (!createdAt) return '--:--';
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return '--:--';
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      if (isToday) return `Hoy, ${timeStr}`;
      return `${date.toLocaleDateString([], { day: '2-digit', month: 'short' })}, ${timeStr}`;
    } catch (e) { return '--:--'; }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!msgInput.trim() || !user || !db || !selectedAffiliate) return
    const content = msgInput.trim();
    const timestamp = new Date().toISOString();
    setMsgInput('')

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

  const handleDeleteMessage = (id: string) => {
    deleteDocumentNonBlocking(doc(db, 'private_messages', id));
    toast({ title: "Mensaje eliminado" });
  };

  const handleSaveEdit = () => {
    if (!editingMsgId || !editContent.trim()) return;
    updateDocumentNonBlocking(doc(db, 'private_messages', editingMsgId), { content: editContent.trim(), edited: true });
    setEditingId(null);
    setEditContent('');
  };

  const filteredAffiliates = affiliates.filter(a => 
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <DashboardShell role="admin">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight uppercase italic">Buzón <span className="text-primary">Maestro</span></h1>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
               <ShieldCheck className="h-3 w-3" /> Comunicaciones 100% Privadas
            </p>
          </div>
          {notifPermission !== 'granted' && (
            <Button onClick={() => Notification.requestPermission()} variant="outline" className="h-10 px-4 rounded-xl border-amber-200 text-amber-600 text-[9px] font-black uppercase shadow-sm">
              <Bell className="mr-2 h-3 w-3" /> Activar Alertas de Escritorio
            </Button>
          )}
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          {/* SIDEBAR DE CONTACTOS (ESTILO MAIL) */}
          <Card className={cn(
            "w-full md:w-[350px] shrink-0 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden flex flex-col ring-1 ring-slate-100",
            mobileShowChat ? "hidden md:flex" : "flex"
          )}>
            <CardHeader className="p-8 bg-slate-50 border-b space-y-6">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                   <Inbox className="h-5 w-5" />
                 </div>
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Bandeja de Entrada</h3>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Buscar socio..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="h-12 bg-white border-none ring-1 ring-slate-200 pl-11 rounded-2xl text-[14px] font-bold" 
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {filteredAffiliates.length === 0 ? (
                    <div className="text-center py-20 opacity-20 space-y-2">
                       <Users className="h-10 w-10 mx-auto" />
                       <p className="text-[10px] font-black uppercase">Sin resultados</p>
                    </div>
                  ) : (
                    filteredAffiliates.map((aff) => (
                      <button 
                        key={aff.id} 
                        onClick={() => { setSelectedAffiliate(aff); setMobileShowChat(true); }} 
                        className={cn(
                          "w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-300 relative group",
                          selectedAffiliate?.id === aff.id ? "bg-slate-900 text-white shadow-xl rotate-1" : "hover:bg-slate-50"
                        )}
                      >
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-lg shrink-0",
                          selectedAffiliate?.id === aff.id ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                        )}>
                          {aff.firstName?.charAt(0)}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className={cn("text-xs font-black uppercase truncate", selectedAffiliate?.id === aff.id ? "text-white" : "text-slate-900")}>
                            {aff.firstName} {aff.lastName}
                          </p>
                          <p className={cn("text-[9px] font-bold uppercase tracking-widest truncate mt-0.5", selectedAffiliate?.id === aff.id ? "text-slate-400" : "text-slate-400")}>
                            Ver Mensajes Privados
                          </p>
                        </div>
                        {selectedAffiliate?.id === aff.id && (
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* ÁREA DE CONVERSACIÓN (DERECHA) */}
          <Card className={cn(
            "flex-1 border-none shadow-2xl rounded-[3.5rem] bg-[#E5DDD5] overflow-hidden flex flex-col relative ring-1 ring-slate-100",
            !mobileShowChat ? "hidden md:flex" : "flex"
          )}>
            <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none" />
            
            {!selectedAffiliate ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white/50 backdrop-blur-md relative z-10">
                <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary shadow-inner mb-8">
                  <Mail className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-headline font-black text-slate-500 uppercase italic">Selecciona un Socio</h3>
                <p className="text-sm text-slate-400 font-medium max-w-xs mt-4">Haz clic en un afiliado de la lista para gestionar su soporte privado.</p>
              </div>
            ) : (
              <>
                <CardHeader className="bg-[#075E54] text-white p-6 md:p-8 shrink-0 flex items-center justify-between relative z-20 shadow-xl">
                  <div className="flex items-center gap-5">
                    <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10" onClick={() => setMobileShowChat(false)}>
                      <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center font-black text-lg border border-white/10 shadow-lg">
                      {selectedAffiliate.firstName?.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-headline font-black uppercase tracking-tight">{selectedAffiliate.firstName} {selectedAffiliate.lastName}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                        <p className="text-[9px] text-white/60 font-black uppercase tracking-widest">Socio Platinum Activo</p>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="hidden sm:flex border-white/20 text-white font-black text-[9px] uppercase px-4 h-8 rounded-full">CANAL PRIVADO</Badge>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col z-10">
                  <ScrollArea className="flex-1 p-6 md:p-12">
                    <div className="space-y-6">
                      {messagesLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white/50 h-8 w-8" /></div>
                      ) : privateMessages.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 backdrop-blur-sm rounded-[3rem] border border-white/10 space-y-4">
                           <MessageCircle className="h-12 w-12 text-white/20 mx-auto" />
                           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Aún no hay mensajes en este buzón.</p>
                        </div>
                      ) : (
                        privateMessages.map((msg) => (
                          <div key={msg.id} className={cn("flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2", msg.fromAdmin ? "ml-auto items-end" : "items-start")}>
                            <div className={cn(
                              "group p-5 rounded-[2rem] text-[14px] font-bold shadow-xl relative transition-all duration-300", 
                              msg.fromAdmin ? "bg-[#DCF8C6] text-slate-800 rounded-tr-none ring-1 ring-black/5" : "bg-white text-slate-800 rounded-tl-none border"
                            )}>
                              {editingMsgId === msg.id ? (
                                <div className="flex flex-col gap-3 min-w-[200px]">
                                  <Input 
                                    value={editContent} 
                                    onChange={e => setEditContent(e.target.value)} 
                                    className="h-12 text-[15px] rounded-xl font-bold bg-white" 
                                    autoFocus 
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSaveEdit}><Check className="h-4 w-4" /></Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {msg.content}
                                  <div className="mt-2 flex items-center gap-2 text-[8px] font-black uppercase opacity-40 justify-end italic">
                                    {msg.edited && "(editado) "}{formatDateTime(msg.createdAt)}
                                    {msg.fromAdmin && <CheckCheck className="h-3 w-3 text-blue-500" />}
                                  </div>
                                  
                                  {msg.fromAdmin && (
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                            <MoreVertical className="h-4 w-4 text-slate-400" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="rounded-2xl p-2">
                                          <DropdownMenuItem className="rounded-xl font-black text-[10px] uppercase" onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}>Editar Mensaje</DropdownMenuItem>
                                          <DropdownMenuItem className="rounded-xl font-black text-[10px] uppercase text-red-600" onClick={() => handleDeleteMessage(msg.id)}>Borrar</DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={scrollRefPriv} />
                    </div>
                  </ScrollArea>

                  <div className="p-6 md:p-8 bg-[#F0F2F5] shrink-0 border-t shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-20">
                    <form onSubmit={handleSendMessage} className="flex gap-4 max-w-5xl mx-auto">
                      <Input 
                        placeholder="Escribe un mensaje privado..." 
                        value={msgInput} 
                        onChange={(e) => setMsgInput(e.target.value)} 
                        className="h-16 bg-white border-none shadow-inner rounded-2xl px-8 font-bold text-[15px]" 
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        className="h-16 w-16 rounded-2xl bg-[#075E54] hover:bg-[#054c44] text-white shadow-2xl shrink-0 transition-all active:scale-90"
                      >
                        <Send className="h-7 w-7" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

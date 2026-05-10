"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Send, 
  ShieldCheck, 
  Crown,
  CheckCheck,
  Loader2,
  X,
  Check,
  MoreVertical,
  Bell,
  Inbox,
  UserCheck,
  MessageSquare
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
import { collection, query, doc, where } from 'firebase/firestore'
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

export default function AffiliateInboxPage() {
  const db = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  
  const [msgInput, setMsgInput] = useState('')
  const [editingMsgId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [mounted, setMounted] = useState(false);

  const scrollRefPriv = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true);
  }, []);

  const affiliateRef = useMemoFirebase(() => (db && user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile } = useDoc(affiliateRef);

  const privateQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(collection(db, 'private_messages'), where('affiliateId', '==', user.uid));
  }, [db, user]);
  
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
  }, [privateMessages.length]);

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
    if (!msgInput.trim() || !user || !db) return
    const content = msgInput.trim();
    const userName = profile?.firstName ? `${profile.firstName} ${profile.lastName}`.trim().toUpperCase() : "SOCIO";
    const timestamp = new Date().toISOString();
    setMsgInput('')

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

  if (!mounted) return null;

  return (
    <DashboardShell role="affiliate">
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <div className="space-y-1">
             <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight uppercase italic">Mi <span className="text-primary">Buzón Privado</span></h1>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
               <ShieldCheck className="h-3 w-3" /> Soporte Directo con Administración
             </p>
          </div>
          <Badge className="bg-slate-900 text-white font-black text-[10px] px-5 py-2 rounded-full uppercase tracking-widest border-none shadow-lg">
             ESTADO: EN LÍNEA
          </Badge>
        </div>

        <Card className="flex-1 border-none shadow-2xl rounded-[3.5rem] bg-[#E5DDD5] overflow-hidden flex flex-col relative ring-1 ring-slate-100">
          <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-[0.06] pointer-events-none" />
          
          <CardHeader className="bg-[#075E54] text-white p-6 md:p-8 shrink-0 flex items-center justify-between relative z-20 shadow-xl">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center border border-white/10 shadow-lg animate-pulse">
                <Crown className="h-7 w-7 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-headline font-black uppercase tracking-tight">Administración Sync</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  <p className="text-[9px] text-white/60 font-black uppercase tracking-widest">Soporte VIP 24/7</p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col z-10">
            <ScrollArea className="flex-1 p-6 md:p-12">
              <div className="space-y-6 max-w-5xl mx-auto">
                {messagesLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-white/50 h-8 w-8" /></div>
                ) : privateMessages.length === 0 ? (
                   <div className="text-center py-20 bg-white/10 backdrop-blur-md rounded-[3rem] border border-white/10 space-y-6">
                      <Inbox className="h-16 w-16 text-white/20 mx-auto" />
                      <div className="space-y-2">
                        <h4 className="text-xl font-headline font-black text-white uppercase italic">¿Necesitas ayuda?</h4>
                        <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Escríbenos y un administrador te responderá en breve.</p>
                      </div>
                   </div>
                ) : (
                  privateMessages.map((msg) => (
                    <div key={msg.id} className={cn("flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2", !msg.fromAdmin ? "ml-auto items-end" : "items-start")}>
                      <div className="flex items-center gap-2 mb-2 px-4">
                        <span className="text-[9px] font-black uppercase text-slate-500/70 tracking-widest">
                          {msg.fromAdmin ? "Soporte Central" : "Tú"}
                        </span>
                      </div>
                      <div className={cn(
                        "group p-6 rounded-[2rem] text-[14px] font-bold shadow-xl relative transition-all duration-300", 
                        !msg.fromAdmin ? "bg-[#DCF8C6] text-slate-800 rounded-tr-none ring-1 ring-black/5" : "bg-white text-slate-800 rounded-tl-none border"
                      )}>
                        {editingMsgId === msg.id ? (
                          <div className="flex flex-col gap-3 min-w-[220px]">
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
                              {!msg.fromAdmin && <CheckCheck className="h-3 w-3 text-blue-500" />}
                            </div>
                            {!msg.fromAdmin && (
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                      <MoreVertical className="h-4 w-4 text-slate-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="rounded-2xl p-2">
                                    <DropdownMenuItem className="rounded-xl font-black text-[10px] uppercase" onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}>Editar</DropdownMenuItem>
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

            <div className="p-6 md:p-10 bg-[#F0F2F5] shrink-0 border-t shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-20">
              <form onSubmit={handleSendMessage} className="flex gap-4 max-w-4xl mx-auto">
                <Input 
                  placeholder="Escribe al administrador..." 
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
        </Card>
      </div>
    </DashboardShell>
  )
}


"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BadgeDollarSign, ShoppingBag, TrendingUp, Users, Loader2, Landmark, CalendarClock, Camera, ArrowUpRight, Wallet, Link as LinkIcon, Copy, Check, MessageSquare, Bell } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, updateDocumentNonBlocking } from '@/firebase'
import { collection, query, where, doc, orderBy } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function AffiliateDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();

  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const affiliateRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'affiliates', user.uid);
  }, [db, user]);
  
  const { data: profile, isLoading: profileLoading } = useDoc(affiliateRef);

  const salesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'sales'), where('affiliateId', '==', user.uid));
  }, [db, user]);
  
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: notifications, isLoading: notificationsLoading } = useCollection(notificationsQuery);

  const isLoading = isAuthLoading || profileLoading;

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/auth/register?role=buyer&ref=${user?.uid}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: t.linkCopied,
      description: "Tus nuevos compradores se vincularán a tu cuenta.",
    });
  };

  const handleUpdatePhoto = () => {
    if (!affiliateRef || !newPhotoUrl) return;
    
    updateDocumentNonBlocking(affiliateRef, { photoUrl: newPhotoUrl });
    toast({
      title: t.language === 'es' ? "Perfil actualizado" : "Profile updated",
      description: t.language === 'es' ? "Tu nueva imagen ya es visible." : "Your new image is now visible.",
    });
    setIsEditingPhoto(false);
  };

  const totalCommissions = sales?.reduce((acc, s) => acc + (s.commissionEarned || 0), 0) || 0;

  const stats = [
    { title: t.balance, value: `$${profile?.currentBalance?.toFixed(2) || '0.00'}`, icon: Wallet, color: "text-primary", bg: "bg-primary/5" },
    { title: t.totalSales, value: sales?.length.toString() || '0', icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Ganancias Totales", value: `$${totalCommissions.toFixed(2)}`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
    { title: "Estado", value: profile?.status === 'Blocked' ? t.blockedStatus : (profile?.status || t.active), icon: Users, color: profile?.status === 'Blocked' ? "text-red-500" : "text-slate-500", bg: "bg-slate-50" },
  ]

  if (!isMounted || isLoading) {
    return (
      <DashboardShell role="affiliate">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-12">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="relative">
              <Avatar className="h-28 w-28 border-8 border-white shadow-2xl rotate-3 transition-transform hover:rotate-0">
                <AvatarImage src={profile?.photoUrl} className="object-cover" />
                <AvatarFallback className="bg-primary text-white text-4xl font-black">
                  {profile?.firstName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={() => setIsEditingPhoto(true)}
                className="absolute -bottom-1 -right-1 bg-white p-3 rounded-2xl shadow-xl border hover:bg-slate-50 transition-all text-primary"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
            <div>
              <h1 className="text-4xl font-headline font-black text-slate-900 leading-tight tracking-tight">
                {t.welcomeBack}, {profile?.firstName || 'Campeón'} 👋
              </h1>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-3 mt-2">
                 <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Partner Verificado Sync
              </p>
            </div>
          </div>
          
          <Card className="md:max-w-md border-none bg-white shadow-2xl rounded-[2.5rem] p-6 ring-1 ring-slate-100 relative overflow-hidden">
             <div className="flex flex-col gap-4 relative z-10">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                      <LinkIcon className="h-5 w-5" />
                   </div>
                   <div className="space-y-0.5">
                      <h3 className="text-sm font-black text-slate-900 tracking-tight">{t.inviteLink}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.inviteLinkDesc}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                   <Input readOnly value={inviteLink} className="h-12 text-[10px] font-mono bg-slate-50 border-none rounded-xl" />
                   <Button onClick={handleCopyLink} size="icon" className="h-12 w-12 rounded-xl shrink-0 bg-primary shadow-lg shadow-primary/20">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                   </Button>
                </div>
             </div>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white group overflow-hidden ring-1 ring-slate-50">
              <CardContent className="p-10">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 rounded-[1.25rem] ${stat.bg} ${stat.color} shadow-inner`}>
                    <stat.icon className="h-7 w-7" />
                  </div>
                  <ArrowUpRight className="h-6 w-6 text-slate-100 group-hover:text-primary transition-colors duration-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.title}</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Notifications Section */}
          <Card className="lg:col-span-4 border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden ring-1 ring-white/5">
            <CardHeader className="px-10 pt-12 pb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-headline font-black tracking-tight">{t.platformMessages}</CardTitle>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Notificaciones Directas</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-12">
              <div className="space-y-4">
                {notificationsLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
                ) : !notifications || notifications.length === 0 ? (
                  <div className="text-center py-10 opacity-30">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2" />
                    <p className="text-xs uppercase font-black tracking-widest">Sin mensajes</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div key={n.id} className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                          n.type === 'welcome' ? "bg-blue-500/20 text-blue-400" : "bg-primary/20 text-primary"
                        )}>
                          {n.type || 'SYSTEM'}
                        </span>
                        <span className="text-[8px] font-bold text-slate-600">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}</span>
                      </div>
                      <h4 className="text-sm font-black text-white mb-1 group-hover:text-primary transition-colors">{n.title}</h4>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card className="lg:col-span-8 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-50">
            <CardHeader className="px-10 py-8 border-b border-slate-50 bg-slate-50/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-headline font-black text-slate-900 tracking-tight">Ventas Recientes</CardTitle>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Últimos movimientos financieros</p>
              </div>
              <Button variant="ghost" className="text-xs font-black uppercase text-primary tracking-widest">Ver Todo</Button>
            </CardHeader>
            <CardContent className="p-0">
              {salesLoading ? (
                <div className="flex justify-center py-24"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-50" /></div>
              ) : !sales || sales.length === 0 ? (
                <div className="text-center py-32">
                  <ShoppingBag className="h-20 w-20 text-slate-100 mx-auto mb-6 rotate-12" />
                  <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Aún no has registrado ventas. ¡Es momento de empezar!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="px-10 h-16 uppercase text-[10px] font-black text-slate-400 tracking-widest">ID Operación</TableHead>
                        <TableHead className="h-16 uppercase text-[10px] font-black text-slate-400 tracking-widest">Producto / Servicio</TableHead>
                        <TableHead className="h-16 uppercase text-[10px] font-black text-slate-400 tracking-widest">Importe</TableHead>
                        <TableHead className="px-10 text-right h-16 uppercase text-[10px] font-black text-slate-400 tracking-widest">Comisión Neta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.slice(0, 5).map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-slate-50/30 transition-colors h-20">
                          <TableCell className="px-10 font-mono text-[10px] font-black text-slate-300">#{sale.id.substring(0, 8)}</TableCell>
                          <TableCell className="font-black text-slate-800 tracking-tight">{sale.productName || sale.productId}</TableCell>
                          <TableCell className="font-bold text-slate-500 tracking-tighter">${sale.saleAmount?.toFixed(2)}</TableCell>
                          <TableCell className="px-10 text-right">
                             <span className="bg-green-50 text-green-600 font-black px-4 py-2 rounded-xl text-lg tracking-tighter inline-block shadow-sm">
                               ${sale.commissionEarned?.toFixed(2)}
                             </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Photo Dialog */}
      <Dialog open={isEditingPhoto} onOpenChange={setIsEditingPhoto}>
        <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-10 text-white text-center">
             <Camera className="h-16 w-16 mx-auto mb-6" />
             <DialogHeader>
               <DialogTitle className="text-3xl font-headline font-black text-white text-center tracking-tight">{t.updatePhoto}</DialogTitle>
             </DialogHeader>
          </div>
          <div className="p-10 space-y-8">
            <div className="space-y-3">
              <Label className="font-black text-xs text-slate-600 uppercase tracking-widest px-1">{t.photoUrlLabel}</Label>
              <Input 
                placeholder="https://images.unsplash.com/..."
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                className="h-16 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 px-6 text-sm font-bold"
              />
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setIsEditingPhoto(false)} className="flex-1 h-14 rounded-2xl font-black text-slate-400">CANCELAR</Button>
              <Button onClick={handleUpdatePhoto} className="flex-1 h-14 rounded-2xl bg-primary text-white font-black shadow-xl shadow-primary/20">GUARDAR FOTO</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}

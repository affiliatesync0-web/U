
"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, TrendingUp, Loader2, Wallet, Link as LinkIcon, Copy, Check, Smartphone, ArrowUpRight, Camera, GraduationCap, ChevronRight, MapPin, Bell } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, updateDocumentNonBlocking } from '@/firebase'
import { collection, query, where, doc, onSnapshot } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import Link from 'next/link'

export default function AffiliateDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();

  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && user?.uid) {
      setInviteLink(`${window.location.origin}/auth/register/buyer?ref=${user.uid}`);
      
      // Escuchar notificaciones en tiempo real
      const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), where('isRead', '==', false));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const notif = change.doc.data();
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(notif.title, { body: notif.message });
            }
            toast({ title: notif.title, description: notif.message });
          }
        });
      });
      return () => unsubscribe();
    }
  }, [isMounted, user]);

  const affiliateRef = useMemoFirebase(() => (db && user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile, isLoading: profileLoading } = useDoc(affiliateRef);

  useEffect(() => {
    if (isMounted && user?.uid && profile && affiliateRef) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateDocumentNonBlocking(affiliateRef, {
              lastLocation: { lat: position.coords.latitude, lng: position.coords.longitude, updatedAt: new Date().toISOString() }
            });
          }
        );
      }
    }
  }, [isMounted, user, profile]);

  const salesQuery = useMemoFirebase(() => (db && user ? query(collection(db, 'sales'), where('affiliateId', '==', user.uid)) : null), [db, user]);
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  const stats = [
    { title: t.balance, value: `$${profile?.currentBalance?.toFixed(2) || '0.00'}`, icon: Wallet, color: "text-primary", bg: "bg-primary/5" },
    { title: t.totalSales, value: sales?.length.toString() || '0', icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Ganancias Totales", value: `$${(sales?.reduce((acc, s) => acc + (s.commissionEarned || 0), 0) || 0).toFixed(2)}`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
  ]

  if (!isMounted || isAuthLoading || profileLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white shadow-xl rotate-3">
                <AvatarImage src={getGoogleDriveDirectLink(profile?.photoUrl)} />
                <AvatarFallback className="bg-primary text-white text-2xl font-black">{profile?.firstName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <button onClick={() => setIsEditingPhoto(true)} className="absolute -bottom-1 -right-1 bg-white p-2 rounded-xl shadow-lg border text-primary"><Camera className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight leading-none uppercase italic">{t.welcomeBack}, {profile?.firstName}</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Workspace de Afiliado Sync</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-10 px-5 bg-white rounded-xl flex items-center gap-3 shadow-sm border border-slate-100"><Wallet className="h-4 w-4 text-primary" /><span className="text-xs font-black">${profile?.currentBalance?.toFixed(2)}</span></div>
             <div className="h-10 px-5 bg-slate-900 rounded-xl flex items-center gap-3 text-white shadow-xl"><Smartphone className="h-4 w-4 text-primary" /><span className="text-[9px] font-black uppercase tracking-widest">+{profile?.whatsappNumber}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                  <Card key={stat.title} className="border-none shadow-xl rounded-[2.5rem] bg-white group hover:scale-[1.02] transition-all overflow-hidden ring-1 ring-slate-100">
                    <CardContent className="p-8">
                      <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-inner`}><stat.icon className="h-6 w-6" /></div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
                <CardHeader className="px-10 py-8 border-b border-slate-50"><CardTitle className="text-xl font-headline font-black text-slate-900 uppercase">Ventas Recientes</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {salesLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> : 
                  !sales || sales.length === 0 ? <div className="text-center py-20 opacity-30"><ShoppingBag className="h-12 w-12 mx-auto mb-4" /><p className="text-xs font-black uppercase">Sin ventas todavía</p></div> : (
                    <Table><TableHeader><TableRow className="bg-slate-50/50 hover:bg-slate-50/50"><TableHead className="px-10 uppercase text-[9px] font-black text-slate-400">Producto</TableHead><TableHead className="uppercase text-[9px] font-black text-slate-400">Monto</TableHead><TableHead className="px-10 text-right uppercase text-[9px] font-black text-slate-400">Comisión</TableHead></TableRow></TableHeader>
                    <TableBody>{sales.slice(0, 4).map((sale) => (
                      <TableRow key={sale.id} className="h-16 hover:bg-slate-50/30 border-b last:border-0"><TableCell className="px-10 font-black text-xs uppercase">{sale.productName}</TableCell><TableCell className="font-bold text-slate-500 text-xs">${sale.saleAmount}</TableCell><TableCell className="px-10 text-right font-black text-green-600">+${sale.commissionEarned}</TableCell></TableRow>
                    ))}</TableBody></Table>
                  )}
                </CardContent>
              </Card>
           </div>
           <div className="lg:col-span-4 space-y-8">
              <Card className="border-none bg-white shadow-2xl rounded-[3rem] p-10 ring-1 ring-slate-100 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12"><LinkIcon className="h-20 w-20" /></div>
                 <div className="flex flex-col gap-6 relative z-10">
                    <div className="flex items-center gap-4"><div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner"><LinkIcon className="h-6 w-6" /></div><div><h3 className="text-sm font-black uppercase">{t.inviteLink}</h3><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Prospectos se vinculan aquí</p></div></div>
                    <div className="space-y-3"><Input readOnly value={inviteLink} className="h-14 text-[10px] font-mono bg-slate-50 border-none rounded-2xl px-5" /><Button onClick={() => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); toast({ title: "Copiado" }); }} className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 gap-2">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "COPIADO" : "COPIAR ENLACE"}</Button></div>
                 </div>
              </Card>
              <Card className="border-none bg-slate-900 shadow-2xl rounded-[3rem] p-10 text-white relative overflow-hidden group">
                 <div className="relative z-10 space-y-6"><div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl"><Bell className="h-6 w-6" /></div><div className="space-y-2"><h4 className="text-xl font-headline font-black uppercase">Notificaciones</h4><p className="text-slate-400 text-xs font-medium">Activa los permisos para recibir alertas del administrador en tiempo real.</p></div><Button onClick={() => Notification.requestPermission()} variant="outline" className="w-full h-12 rounded-xl border-white/10 text-white font-black text-[10px] uppercase">ACTIVAR ALERTAS</Button></div>
              </Card>
           </div>
        </div>
      </div>
      <Dialog open={isEditingPhoto} onOpenChange={setIsEditingPhoto}>
        <DialogContent className="rounded-[3rem] p-10 overflow-hidden border-none shadow-2xl">
          <div className="space-y-8">
            <DialogHeader><DialogTitle className="text-2xl font-black text-center uppercase italic">Actualizar <span className="text-primary">Foto</span></DialogTitle></DialogHeader>
            <Input placeholder="URL de la imagen..." value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)} className="h-16 rounded-2xl" />
            <Button onClick={() => { updateDocumentNonBlocking(affiliateRef!, { photoUrl: newPhotoUrl }); setIsEditingPhoto(false); toast({ title: "Actualizado" }); }} className="w-full h-14 rounded-2xl bg-primary text-white font-black">GUARDAR</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}

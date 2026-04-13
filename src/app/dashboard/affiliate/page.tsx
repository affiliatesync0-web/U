
"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, TrendingUp, Loader2, Wallet, Link as LinkIcon, Copy, Check, Smartphone, Camera, MapPin, Bell, BadgeCheck } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, updateDocumentNonBlocking } from '@/firebase'
import { collection, query, where, doc, onSnapshot } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { getGoogleDriveDirectLink } from '@/lib/utils'
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
  const [inviteLink, setInviteLink] = useState('');
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied' | 'watching'>('pending');
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && user?.uid) {
      // Usar window.location.origin de forma segura en el cliente
      const origin = window.location.origin;
      setInviteLink(`${origin}/auth/register/buyer?ref=${user.uid}`);
      
      const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), where('isRead', '==', false));
      const unsubscribeNotifs = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const notif = change.doc.data();
            toast({ title: notif.title, description: notif.message });
          }
        });
      });

      return () => unsubscribeNotifs();
    }
  }, [isMounted, user, db, toast]);

  const affiliateRef = useMemoFirebase(() => (db && user ? doc(db, 'affiliates', user.uid) : null), [db, user]);
  const { data: profile, isLoading: profileLoading } = useDoc(affiliateRef);

  useEffect(() => {
    if (isMounted && user?.uid && profile && affiliateRef) {
      if ("geolocation" in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            setLocationStatus('watching');
            updateDocumentNonBlocking(affiliateRef, {
              lastLocation: { lat: position.coords.latitude, lng: position.coords.longitude, updatedAt: new Date().toISOString() }
            });
          },
          () => setLocationStatus('denied'),
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
        );
      }
    }
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [isMounted, user, profile, affiliateRef]);

  // PRIVACIDAD: Solo mis ventas (Filtro por affiliateId)
  const salesQuery = useMemoFirebase(() => (db && user ? query(collection(db, 'sales'), where('affiliateId', '==', user.uid)) : null), [db, user]);
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  if (!isMounted || isAuthLoading || profileLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-primary" /></div>

  // Solo sumar comisiones que ya han sido aprobadas (status === 'Completed')
  const totalEarnedApproved = (sales || [])
    .filter(s => s.status === 'Completed')
    .reduce((acc, s) => acc + (s.commissionEarned || 0), 0);

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
              <button onClick={() => setIsEditingPhoto(true)} className="absolute -bottom-1 -right-1 bg-white p-2 rounded-xl shadow-lg border text-primary transition-transform hover:scale-110"><Camera className="h-4 w-4" /></button>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight uppercase italic">{t.welcomeBack}, {profile?.firstName}</h1>
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]"> Workspace Socio Platinum</p>
                {locationStatus === 'watching' && <Badge className="bg-green-100 text-green-600 border-none text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />MAPA ACTIVO</Badge>}
              </div>
            </div>
          </div>
          <div className="h-10 px-5 bg-white rounded-xl flex items-center gap-3 shadow-sm border border-slate-100"><Wallet className="h-4 w-4 text-primary" /><span className="text-xs font-black">${profile?.currentBalance?.toFixed(2)}</span></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: t.balance, value: `$${profile?.currentBalance?.toFixed(2) || '0.00'}`, icon: Wallet, color: "text-primary", bg: "bg-primary/5" },
                  { title: t.totalSales, value: sales?.length.toString() || '0', icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" },
                  { title: "Ganancias Aprobadas", value: `$${totalEarnedApproved.toFixed(2)}`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
                ].map((stat) => (
                  <Card key={stat.title} className="border-none shadow-xl rounded-[2.5rem] bg-white hover:scale-[1.02] transition-all ring-1 ring-slate-100">
                    <CardContent className="p-8">
                      <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-inner`}><stat.icon className="h-6 w-6" /></div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
                <CardHeader className="px-10 py-8 border-b border-slate-50"><CardTitle className="text-xl font-headline font-black text-slate-900 uppercase">Mis Ventas Recientes</CardTitle></CardHeader>
                <CardContent className="p-0">
                  {salesLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> : 
                  !sales || sales.length === 0 ? <div className="text-center py-20 opacity-30"><ShoppingBag className="h-12 w-12 mx-auto mb-4" /><p className="text-xs font-black uppercase">Sin ventas registradas</p></div> : (
                    <Table><TableHeader><TableRow className="bg-slate-50/50"><TableHead className="px-10 uppercase text-[9px] font-black text-slate-400">Producto</TableHead><TableHead className="uppercase text-[9px] font-black text-slate-400">Estado</TableHead><TableHead className="px-10 text-right uppercase text-[9px] font-black text-slate-400">Comisión</TableHead></TableRow></TableHeader>
                    <TableBody>{sales.slice(0, 10).map((sale) => (
                      <TableRow key={sale.id} className="h-16 hover:bg-slate-50/30 border-b last:border-0">
                        <TableCell className="px-10 font-black text-xs uppercase">{sale.productName}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-[8px] font-black uppercase border-none", sale.status === 'Completed' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600")}>
                            {sale.status === 'Completed' ? 'Aprobada ✓' : 'Pendiente Validación'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-10 text-right font-black text-green-600">+${sale.commissionEarned?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}</TableBody></Table>
                  )}
                </CardContent>
              </Card>
           </div>
           <div className="lg:col-span-4 space-y-8">
              <Card className="border-none bg-white shadow-2xl rounded-[3rem] p-10 ring-1 ring-slate-100 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12"><LinkIcon className="h-20 w-20" /></div>
                 <div className="flex flex-col gap-6 relative z-10">
                    <div className="flex items-center gap-4"><div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner"><LinkIcon className="h-6 w-6" /></div><div><h3 className="text-sm font-black uppercase">{t.inviteLink}</h3><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Sincroniza tus prospectos</p></div></div>
                    <div className="space-y-3">
                      <Input readOnly value={inviteLink} className="h-14 text-[10px] font-mono bg-slate-50 border-none rounded-2xl px-5" />
                      <Button onClick={() => { 
                        navigator.clipboard.writeText(inviteLink); 
                        setCopied(true); 
                        setTimeout(() => setCopied(false), 2000); 
                        toast({ title: "Enlace Copiado", description: "Envíalo a tus clientes potenciales." }); 
                      }} className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 gap-2">
                        {copied ? <BadgeCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? "VINCULADO" : "COPIAR LINK"}
                      </Button>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
      <Dialog open={isEditingPhoto} onOpenChange={setIsEditingPhoto}>
        <DialogContent className="rounded-[3rem] p-10 border-none shadow-2xl bg-white">
          <div className="space-y-8">
            <DialogHeader><DialogTitle className="text-2xl font-black text-center uppercase italic">Cambiar <span className="text-primary">Foto de Perfil</span></DialogTitle></DialogHeader>
            <Input placeholder="Pega la URL de tu imagen aquí..." value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)} className="h-16 rounded-2xl" />
            <Button onClick={() => { 
              if(affiliateRef) updateDocumentNonBlocking(affiliateRef, { photoUrl: newPhotoUrl }); 
              setIsEditingPhoto(false); 
              setNewPhotoUrl('');
              toast({ title: "Foto Actualizada" }); 
            }} className="w-full h-14 rounded-2xl bg-primary text-white font-black">GUARDAR CAMBIOS</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}

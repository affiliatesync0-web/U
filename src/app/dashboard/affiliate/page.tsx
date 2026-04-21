"use client"

import { useState, useEffect, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  ShoppingBag, 
  TrendingUp, 
  Loader2, 
  Wallet, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Camera, 
  BadgeCheck,
  ArrowUpRight,
  Zap,
  ShieldCheck,
  ChevronRight
} from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, updateDocumentNonBlocking } from '@/firebase'
import { collection, query, where, doc, onSnapshot } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function AffiliateDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

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

  const salesQuery = useMemoFirebase(() => (db && user ? query(collection(db, 'sales'), where('affiliateId', '==', user.uid)) : null), [db, user]);
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  if (!isMounted || isAuthLoading || profileLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-primary" /></div>

  const totalEarnedApproved = (sales || [])
    .filter(s => s.status === 'Completed')
    .reduce((acc, s) => acc + (s.commissionEarned || 0), 0);

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <Avatar className="h-24 w-24 border-[6px] border-white dark:border-slate-900 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <AvatarImage src={getGoogleDriveDirectLink(profile?.photoUrl)} />
                <AvatarFallback className="bg-slate-900 text-white text-3xl font-black">{profile?.firstName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <button 
                onClick={() => setIsEditingPhoto(true)} 
                className="absolute -bottom-1 -right-1 bg-primary text-white p-2.5 rounded-2xl shadow-2xl transition-all hover:scale-110 active:scale-95 border-2 border-white dark:border-slate-900"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-headline font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase italic">
                {t.welcomeBack}, <span className="text-primary">{profile?.firstName}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-slate-900 text-white border-none font-black text-[9px] tracking-widest px-3 py-1 uppercase">
                   Rango: Embajador
                </Badge>
                {locationStatus === 'watching' && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                     <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Localizador Activo
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Card className="premium-card bg-slate-900 text-white min-w-[240px] group overflow-hidden">
             <div className="p-8 relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700"><Wallet className="h-20 w-20" /></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Saldo Disponible</p>
                <div className="flex items-center gap-3">
                   <h2 className="text-4xl font-black tracking-tighter italic text-white">${profile?.currentBalance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                   <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-3.5 w-3.5" />
                   </div>
                </div>
             </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Comisiones Pendientes", value: `$${profile?.currentBalance?.toFixed(2) || '0.00'}`, icon: Wallet, color: "text-primary", bg: "bg-primary/5", sub: "Por liquidar" },
            { title: "Ventas Registradas", value: sales?.length.toString() || '0', icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50", sub: "Historial total" },
            { title: "Ganancias Aprobadas", value: `$${totalEarnedApproved.toLocaleString()}`, icon: BadgeCheck, color: "text-green-500", bg: "bg-green-50", sub: "Capital confirmado" },
          ].map((stat, i) => (
            <Card key={i} className="premium-card group">
              <CardContent className="p-10">
                <div className="flex justify-between items-start mb-8">
                  <div className={`h-16 w-16 rounded-[1.5rem] ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon className="h-8 w-8" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-slate-200 group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.title}</p>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic">{stat.value}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-2 flex items-center gap-2">
                     <span className="h-1 w-1 rounded-full bg-slate-200" /> {stat.sub}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8 space-y-8">
              <Card className="premium-card overflow-hidden">
                <CardHeader className="px-10 py-10 border-b border-slate-50 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-headline font-black text-slate-900 uppercase">Mis Ventas Recientes</CardTitle>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Actividad de las últimas 24 horas</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-10 rounded-xl font-black text-[9px] uppercase tracking-widest hover:text-primary" onClick={() => router.push('/dashboard/affiliate/register-sale')}>VER TODO</Button>
                </CardHeader>
                <CardContent className="p-0">
                  {salesLoading ? (
                    <div className="flex justify-center py-32"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" /></div>
                  ) : !sales || sales.length === 0 ? (
                    <div className="text-center py-32 opacity-20 space-y-4">
                      <ShoppingBag className="h-20 w-20 mx-auto text-slate-200" />
                      <p className="text-sm font-black uppercase tracking-widest">Sin transacciones grabadas</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50 h-20">
                            <TableHead className="px-10 uppercase text-[10px] font-black text-slate-400 tracking-widest">Producto Digital</TableHead>
                            <TableHead className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Estado</TableHead>
                            <TableHead className="px-10 text-right uppercase text-[10px] font-black text-slate-400 tracking-widest">Ganancia</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sales.slice(0, 10).map((sale) => (
                            <TableRow key={sale.id} className="h-24 hover:bg-slate-50/30 transition-all border-b last:border-0 group">
                              <TableCell className="px-10">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs shadow-inner group-hover:rotate-3 transition-transform">
                                    {sale.productName?.charAt(0)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-black text-slate-800 uppercase text-xs tracking-tight">{sale.productName}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: {sale.voucherReference}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn(
                                  "text-[9px] font-black px-4 py-1.5 rounded-full uppercase border-none shadow-sm",
                                  sale.status === 'Completed' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700 animate-pulse"
                                )}>
                                  {sale.status === 'Completed' ? 'Validada ✓' : 'En Auditoría'}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-10 text-right font-black text-lg text-green-600 tracking-tighter">
                                +${sale.commissionEarned?.toFixed(2)}
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

           <div className="lg:col-span-4 space-y-10">
              <Card className="premium-card bg-slate-950 text-white p-10 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><LinkIcon className="h-32 w-32 text-primary" /></div>
                 <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                       <div className="h-14 w-14 bg-primary/20 rounded-[1.25rem] flex items-center justify-center text-primary shadow-2xl">
                          <LinkIcon className="h-7 w-7" />
                       </div>
                       <div>
                          <h3 className="text-xl font-headline font-black uppercase italic">{t.inviteLink}</h3>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Cerrador Automático</p>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/10 font-mono text-[10px] text-slate-300 break-all leading-relaxed">
                        {inviteLink}
                      </div>
                      <Button 
                        onClick={() => { 
                          navigator.clipboard.writeText(inviteLink); 
                          setCopied(true); 
                          setTimeout(() => setCopied(false), 2000); 
                          toast({ title: "Enlace Copiado", description: "¡Listo para compartir!" }); 
                        }} 
                        className="w-full h-18 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 gap-3"
                      >
                        {copied ? <BadgeCheck className="h-6 w-6" /> : <Copy className="h-6 w-6" />}
                        {copied ? "COPIADO" : "COPIAR LINK MAESTRO"}
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-3">
                       <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                          <ShieldCheck className="h-4 w-4 text-green-500" /> Atribución Directa Garantizada
                       </div>
                    </div>
                 </div>
              </Card>

              <Card className="premium-card p-10 bg-primary/5 border border-primary/10 flex flex-col gap-6 relative overflow-hidden">
                 <div className="absolute -bottom-10 -right-10 opacity-5"><Zap className="h-48 w-48 text-primary" /></div>
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl -rotate-6"><Zap className="h-6 w-6" /></div>
                    <h4 className="text-lg font-black text-slate-900 uppercase italic leading-none tracking-tight">Sync Lab AI</h4>
                 </div>
                 <p className="text-slate-500 font-medium text-sm leading-relaxed">¿Sin ideas para cerrar? Usa nuestro laboratorio de estrategias para redactar ganchos que duplican las ventas.</p>
                 <Button onClick={() => router.push('/dashboard/affiliate/sales-lab')} variant="outline" className="h-14 rounded-2xl border-primary text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                    ABRIR LABORATORIO
                 </Button>
              </Card>
           </div>
        </div>
      </div>

      <Dialog open={isEditingPhoto} onOpenChange={setIsEditingPhoto}>
        <DialogContent className="rounded-[3.5rem] p-12 border-none shadow-2xl bg-white max-w-md w-[95vw]">
          <div className="space-y-10">
            <div className="text-center space-y-2">
               <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-4 shadow-inner"><Camera className="h-8 w-8" /></div>
               <DialogHeader><DialogTitle className="text-3xl font-headline font-black text-slate-900 text-center uppercase tracking-tight italic">Nueva <span className="text-primary">Imagen</span></DialogTitle></DialogHeader>
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Identidad Visual Platinum</p>
            </div>
            
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">URL de la Foto</Label>
               <Input 
                placeholder="Pega el enlace directo aquí..." 
                value={newPhotoUrl} 
                onChange={(e) => setNewPhotoUrl(e.target.value)} 
                className="h-16 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 px-6 font-bold text-sm" 
               />
            </div>

            <div className="flex flex-col gap-3">
               <Button onClick={() => { 
                if(affiliateRef) updateDocumentNonBlocking(affiliateRef, { photoUrl: newPhotoUrl }); 
                setIsEditingPhoto(false); 
                setNewPhotoUrl('');
                toast({ title: "Perfil Actualizado" }); 
              }} className="w-full h-18 rounded-[1.5rem] bg-slate-900 text-white font-black uppercase text-xs shadow-2xl active:scale-95 transition-all">ACTUALIZAR MI PERFIL</Button>
              <Button variant="ghost" onClick={() => setIsEditingPhoto(false)} className="h-12 rounded-2xl font-black text-[10px] uppercase text-slate-400 tracking-widest">CANCELAR</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}

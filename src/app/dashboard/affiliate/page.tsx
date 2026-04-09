
"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, TrendingUp, Users, Loader2, Wallet, Link as LinkIcon, Copy, Check, Smartphone, ArrowUpRight, Camera, GraduationCap, ExternalLink, Flame, Sparkles, ChevronRight, MapPin } from 'lucide-react'
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
import { collection, query, where, doc } from 'firebase/firestore'
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && user?.uid) {
      setInviteLink(`${window.location.origin}/auth/register?role=buyer&ref=${user.uid}`);
    }
  }, [isMounted, user]);

  const affiliateRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'affiliates', user.uid);
  }, [db, user]);
  
  const { data: profile, isLoading: profileLoading } = useDoc(affiliateRef);

  // EFECTO DE GEOLOCALIZACIÓN: Solo para afiliados
  useEffect(() => {
    if (isMounted && user?.uid && profile && affiliateRef) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            updateDocumentNonBlocking(affiliateRef, {
              lastLocation: {
                lat: latitude,
                lng: longitude,
                updatedAt: new Date().toISOString()
              }
            });
          },
          (error) => {
            console.log("Ubicación no disponible:", error.message);
          },
          { enableHighAccuracy: true }
        );
      }
    }
  }, [isMounted, user, profile, affiliateRef]);

  const salesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'sales'), where('affiliateId', '==', user.uid));
  }, [db, user]);
  
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  const isLoading = isAuthLoading || profileLoading;

  const handleCopyLink = () => {
    if (!inviteLink) return;
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
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white shadow-xl rotate-3 hover:rotate-0 transition-transform">
                <AvatarImage src={getGoogleDriveDirectLink(profile?.photoUrl)} className="object-cover" />
                <AvatarFallback className="bg-primary text-white text-2xl font-black">
                  {profile?.firstName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={() => setIsEditingPhoto(true)}
                className="absolute -bottom-1 -right-1 bg-white p-2 rounded-xl shadow-lg border hover:bg-slate-50 transition-all text-primary"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight leading-none">
                {t.welcomeBack}, {profile?.firstName || 'Campeón'}
              </h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Workspace de Afiliado Sync</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="h-10 px-5 bg-white rounded-xl flex items-center gap-3 shadow-sm border border-slate-100">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-xs font-black text-slate-900">${profile?.currentBalance?.toFixed(2) || '0.00'}</span>
             </div>
             <div className="h-10 px-5 bg-slate-900 rounded-xl flex items-center gap-3 text-white shadow-xl">
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest">+{profile?.whatsappNumber || 'Sin Vincular'}</span>
             </div>
          </div>
        </div>

        {/* ACCESO RÁPIDO A LA ACADEMIA INTEGRADA */}
        <Card className="relative border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden group">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,93,27,0.15),transparent_50%)]" />
           <div className="flex flex-col lg:flex-row items-center relative z-10">
              <div className="flex-1 p-10 md:p-14 space-y-6">
                 <div className="space-y-2">
                    <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tight leading-tight">
                       CENTRO DE <span className="text-primary">CAPACITACIÓN</span>
                    </h2>
                    <p className="text-slate-400 font-medium max-w-xl">
                       Accede a tu entrenamiento maestro directamente dentro de la plataforma con nuestro navegador integrado.
                    </p>
                 </div>
                 <div className="flex flex-wrap gap-4 pt-4">
                    <Button asChild className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all">
                       <Link href="/dashboard/affiliate/academy">
                          ENTRAR A LA ACADEMIA <ChevronRight className="ml-2 h-5 w-5" />
                       </Link>
                    </Button>
                 </div>
              </div>
              <div className="lg:w-[30%] p-10 hidden lg:flex justify-center">
                 <GraduationCap className="h-32 w-32 text-primary/40 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
              </div>
           </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                  <Card key={stat.title} className="border-none shadow-xl rounded-[2.5rem] bg-white group hover:scale-[1.02] transition-all overflow-hidden ring-1 ring-slate-100">
                    <CardContent className="p-8">
                      <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-inner`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
                <CardHeader className="px-10 py-8 border-b border-slate-50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-headline font-black text-slate-900 tracking-tight">Ventas Recientes</CardTitle>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Últimos movimientos financieros</p>
                  </div>
                  <Button asChild variant="ghost" className="text-[10px] font-black uppercase text-primary tracking-widest">
                    <Link href="/dashboard/affiliate/register-sale">Registrar Nueva Venta</Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {salesLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary opacity-50" /></div>
                  ) : !sales || sales.length === 0 ? (
                    <div className="text-center py-20 opacity-30">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">Sin ventas registradas todavía</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead className="px-10 h-14 uppercase text-[9px] font-black text-slate-400 tracking-widest">Producto</TableHead>
                            <TableHead className="h-14 uppercase text-[9px] font-black text-slate-400 tracking-widest">Monto</TableHead>
                            <TableHead className="px-10 text-right h-14 uppercase text-[9px] font-black text-slate-400 tracking-widest">Comisión</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sales.slice(0, 4).map((sale) => (
                            <TableRow key={sale.id} className="hover:bg-slate-50/30 transition-colors h-16">
                              <TableCell className="px-10">
                                <span className="font-black text-slate-800 text-xs uppercase tracking-tight">{sale.productName || 'Curso'}</span>
                              </TableCell>
                              <TableCell className="font-bold text-slate-500 text-xs">${sale.saleAmount?.toFixed(2)}</TableCell>
                              <TableCell className="px-10 text-right">
                                 <span className="text-green-600 font-black text-sm tracking-tighter">
                                   +${sale.commissionEarned?.toFixed(2)}
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

           <div className="lg:col-span-4 space-y-8">
              <Card className="border-none bg-white shadow-2xl rounded-[3rem] p-10 ring-1 ring-slate-100 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12"><LinkIcon className="h-20 w-20" /></div>
                 <div className="flex flex-col gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                          <LinkIcon className="h-6 w-6" />
                       </div>
                       <div className="space-y-0.5">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{t.inviteLink}</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Tus prospectos se vinculan aquí</p>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <Input readOnly value={inviteLink} className="h-14 text-[10px] font-mono bg-slate-50 border-none rounded-2xl px-5" />
                       <Button onClick={handleCopyLink} className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 gap-2">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? "COPIADO" : "COPIAR ENLACE"}
                       </Button>
                    </div>
                 </div>
              </Card>

              <Card className="border-none bg-blue-600 shadow-2xl rounded-[3rem] p-10 text-white relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_70%)]" />
                 <div className="relative z-10 space-y-6">
                    <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl">
                       <TrendingUp className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-xl font-headline font-black uppercase tracking-tight">Laboratorio de Ventas</h4>
                       <p className="text-blue-100 text-sm font-medium leading-relaxed">
                          Utiliza nuestros ganchos y guiones persuasivos para triplicar tus resultados.
                       </p>
                    </div>
                    <Button asChild variant="outline" className="w-full h-12 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all">
                       <Link href="/dashboard/affiliate/sales-lab">IR AL LABORATORIO</Link>
                    </Button>
                 </div>
              </Card>
           </div>
        </div>
      </div>

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

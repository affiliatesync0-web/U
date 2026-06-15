
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
  BadgeCheck,
  ArrowUpRight,
  Zap,
  Camera,
  Bell,
  CheckCircle2,
  Upload,
  RefreshCcw
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
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, updateDocumentNonBlocking, initializeFirebase } from '@/firebase'
import { collection, query, where, doc, onSnapshot, orderBy, limit } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
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
  const [uploading, setUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [copiedAffiliate, setCopiedAffiliate] = useState(false);
  const [inviteAffiliateLink, setInviteAffiliateLink] = useState('');
  
  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && user?.uid) {
      const origin = window.location.origin;
      setInviteAffiliateLink(`${origin}/auth/register/affiliate?ref=${user.uid}`);
      
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

  const notificationsQuery = useMemoFirebase(() => {
    if(!db || !user) return null;
    return query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
  }, [db, user]);
  const { data: notifications } = useCollection(notificationsQuery);

  const salesQuery = useMemoFirebase(() => (db && user ? query(collection(db, 'sales'), where('affiliateId', '==', user.uid)) : null), [db, user]);
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  if (!isMounted || isAuthLoading || profileLoading) return <div className="flex items-center justify-center min-h-[400px] bg-white"><Loader2 className="animate-spin text-primary" /></div>

  const totalEarnedApproved = (sales || [])
    .filter(s => s.status === 'Completed')
    .reduce((acc, s) => acc + (s.commissionEarned || 0), 0);

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Enlace Copiado", description: "¡Listo para compartir!" });
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }
      setShowCamera(true);
    } catch (err) {
      toast({ variant: "destructive", title: "Cámara no disponible", description: "Asegúrate de dar permisos de acceso." });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setNewPhotoUrl(dataUrl);
        stopCamera();
        toast({ title: "Foto capturada ✓" });
      }
    }
  };

  const uploadProfileImage = async (imageSource: string | File) => {
    if (!user || !affiliateRef) return;
    setUploading(true);
    try {
      const { storage } = initializeFirebase();
      const storageRef = ref(storage, `profiles/${user.uid}_${Date.now()}.jpg`);
      
      let blob: Blob;
      if (typeof imageSource === 'string') {
        const response = await fetch(imageSource);
        blob = await response.blob();
      } else {
        blob = imageSource;
      }

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      updateDocumentNonBlocking(affiliateRef, { photoUrl: downloadURL });
      toast({ title: "Perfil Actualizado ✓" });
      setIsEditingPhoto(false);
      setNewPhotoUrl('');
    } catch (error) {
      console.error("Upload error:", error);
      toast({ variant: "destructive", title: "Error al subir", description: "No se pudo procesar la imagen." });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadProfileImage(file);
  };

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-[6px] border-white shadow-2xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                <AvatarImage src={getGoogleDriveDirectLink(profile?.photoUrl)} className="object-cover" />
                <AvatarFallback className="bg-primary text-white text-3xl font-black">{profile?.firstName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <button 
                onClick={() => setIsEditingPhoto(true)} 
                className="absolute -bottom-1 -right-1 bg-primary text-white p-2.5 rounded-2xl shadow-2xl transition-all hover:scale-110 active:scale-95 border-2 border-white"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-headline font-black text-slate-900 tracking-tighter leading-none uppercase italic">
                {t.welcomeBack}, <span className="text-primary">{profile?.firstName}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={cn(
                  "border-none font-black text-[9px] tracking-widest px-3 py-1 uppercase",
                  profile?.status === 'Active' ? "bg-slate-900 text-white" : "bg-red-900 text-white"
                )}>
                   ESTADO: {profile?.status === 'Active' ? 'SOCIO VERIFICADO ✓' : profile?.status === 'Blocked' ? 'ACCESO RESTRINGIDO 🔒' : 'CUENTA EN AUDITORÍA'}
                </Badge>
                {profile?.status === 'Active' && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">
                     <CheckCircle2 className="h-3 w-3" /> Membresía Platinum Activa
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Card className="premium-card bg-slate-900 text-white min-w-[240px] group overflow-hidden border-none shadow-2xl">
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
            <Card key={i} className="premium-card group border-none shadow-xl">
              <CardContent className="p-10">
                <div className="flex justify-between items-start mb-8">
                  <div className={`h-16 w-16 rounded-[1.5rem] ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon className="h-8 w-8" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-slate-200 group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.title}</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">{stat.value}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-2 flex items-center gap-2">
                     <span className="h-1 w-1 rounded-full bg-slate-200" /> {stat.sub}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-4 space-y-8">
              <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-slate-100">
                <CardHeader className="bg-slate-900 p-8 text-white flex flex-row items-center justify-between">
                   <div className="flex items-center gap-3">
                     <Bell className="h-5 w-5 text-primary" />
                     <CardTitle className="text-lg font-headline font-black uppercase italic tracking-tight">Centro de <span className="text-primary">Avisos</span></CardTitle>
                   </div>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="space-y-4">
                      {!notifications || notifications.length === 0 ? (
                        <div className="text-center py-10 opacity-20 space-y-2">
                          <Bell className="h-8 w-8 mx-auto" />
                          <p className="text-[10px] font-black uppercase">Sin avisos nuevos</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 group hover:bg-slate-100 transition-colors">
                             <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-primary uppercase">{notif.title}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(notif.createdAt).toLocaleDateString()}</span>
                             </div>
                             <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                                {notif.message}
                             </p>
                          </div>
                        ))
                      )}
                   </div>
                </CardContent>
              </Card>

              <Card className="premium-card bg-slate-950 text-white p-10 relative overflow-hidden group border-none shadow-2xl">
                 <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><LinkIcon className="h-32 w-32 text-primary" /></div>
                 <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                       <div className="h-14 w-14 bg-primary/20 rounded-[1.25rem] flex items-center justify-center text-primary shadow-2xl">
                          <Zap className="h-7 w-7" />
                       </div>
                       <div>
                          <h3 className="text-xl font-headline font-black uppercase italic">Invitar Socios</h3>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Gana $1.00 por cada registro</p>
                       </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10 font-mono text-[9px] text-slate-300 break-all leading-relaxed">
                        {inviteAffiliateLink}
                      </div>
                      <Button 
                        onClick={() => handleCopy(inviteAffiliateLink, setCopiedAffiliate)} 
                        className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl gap-3"
                      >
                        {copiedAffiliate ? <BadgeCheck className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        {copiedAffiliate ? "COPIADO" : "LINK DE RECLUTAMIENTO"}
                      </Button>
                    </div>
                 </div>
              </Card>
           </div>

           <div className="lg:col-span-8 space-y-8">
              <Card className="premium-card overflow-hidden border-none shadow-2xl">
                <CardHeader className="px-10 py-10 border-b border-slate-50 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-headline font-black text-slate-900 uppercase">Actividad Comercial</CardTitle>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Tus transacciones más recientes</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-10 rounded-xl font-black text-[9px] uppercase tracking-widest hover:text-primary" onClick={() => router.push('/dashboard/affiliate/register-sale')}>VER HISTORIAL</Button>
                </CardHeader>
                <CardContent className="p-0">
                  {salesLoading ? (
                    <div className="flex justify-center py-32"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" /></div>
                  ) : !sales || sales.length === 0 ? (
                    <div className="text-center py-32 opacity-20 space-y-4">
                      <ShoppingBag className="h-20 w-20 mx-auto text-slate-200" />
                      <p className="text-sm font-black uppercase tracking-widest">Sin transacciones registradas</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50 h-20">
                            <TableHead className="px-10 uppercase text-[10px] font-black text-slate-400 tracking-widest">Producto Digital</TableHead>
                            <TableHead className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Estado</TableHead>
                            <TableHead className="px-10 text-right uppercase text-[10px] font-black text-slate-400 tracking-widest">Comisión</TableHead>
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
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID Ref: {sale.voucherReference}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn(
                                  "text-[9px] font-black px-4 py-1.5 rounded-full uppercase border-none shadow-sm",
                                  sale.status === 'Completed' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700 animate-pulse"
                                )}>
                                  {sale.status === 'Completed' ? 'Validada ✓' : 'Pendiente'}
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
        </div>
      </div>

      <Dialog open={isEditingPhoto} onOpenChange={(v) => { setIsEditingPhoto(v); if(!v) stopCamera(); }}>
        <DialogContent className="rounded-[3.5rem] p-10 border-none shadow-2xl bg-white max-w-md w-[95vw]">
          <div className="space-y-8">
            <div className="text-center space-y-2">
               <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4"><Camera className="h-7 w-7" /></div>
               <DialogHeader><DialogTitle className="text-2xl font-headline font-black text-slate-900 text-center uppercase italic">Actualizar <span className="text-primary">Identidad</span></DialogTitle></DialogHeader>
               <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">Socio Embajador Platinum</p>
            </div>
            
            <div className="space-y-6">
               {showCamera ? (
                 <div className="space-y-4 animate-in zoom-in-95 duration-300">
                    <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-950 border-4 border-slate-100 shadow-inner">
                       <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                       <div className="absolute top-4 right-4"><Badge className="bg-red-600 animate-pulse border-none">LIVE</Badge></div>
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="grid grid-cols-2 gap-4">
                       <Button variant="outline" onClick={stopCamera} className="h-14 rounded-2xl font-black text-[10px] uppercase">CANCELAR</Button>
                       <Button onClick={capturePhoto} className="h-14 rounded-2xl bg-primary text-white font-black text-[10px] uppercase shadow-xl">TOMAR FOTO</Button>
                    </div>
                 </div>
               ) : (
                 <>
                   <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Enlace de Imagen (Opcional)</Label>
                      <Input 
                       placeholder="Pega la URL aquí..." 
                       value={newPhotoUrl} 
                       onChange={(e) => setNewPhotoUrl(e.target.value)} 
                       className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 px-6 font-bold text-xs" 
                      />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <Button 
                        onClick={startCamera} 
                        variant="outline" 
                        className="h-24 rounded-2xl border-dashed border-2 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                        disabled={uploading}
                      >
                        <Camera className="h-6 w-6 text-slate-400" />
                        <span className="text-[9px] font-black uppercase">USAR CÁMARA</span>
                      </Button>

                      <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        variant="outline" 
                        className="h-24 rounded-2xl border-dashed border-2 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                        disabled={uploading}
                      >
                        {uploading ? <Loader2 className="animate-spin h-6 w-6" /> : <Upload className="h-6 w-6 text-slate-400" />}
                        <span className="text-[9px] font-black uppercase">{uploading ? "SUBIENDO..." : "SUBIR ARCHIVO"}</span>
                      </Button>
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                 </>
               )}
            </div>

            {!showCamera && (
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-50">
                <Button 
                  onClick={() => { 
                    if (newPhotoUrl.startsWith('data:')) {
                      uploadProfileImage(newPhotoUrl);
                    } else if (newPhotoUrl) {
                      if(affiliateRef) updateDocumentNonBlocking(affiliateRef, { photoUrl: newPhotoUrl });
                      setIsEditingPhoto(false);
                      setNewPhotoUrl('');
                      toast({ title: "Perfil Actualizado ✓" });
                    }
                  }} 
                  className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white font-black uppercase text-xs shadow-2xl active:scale-95 transition-all"
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "GUARDAR CAMBIOS"}
                </Button>
                <button onClick={() => setIsEditingPhoto(false)} className="text-[9px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors">CERRAR VENTANA</button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}


"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BadgeDollarSign, ShoppingBag, TrendingUp, Users, Loader2, Landmark, CalendarClock, Camera, ArrowUpRight, Wallet } from 'lucide-react'
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
import { collection, query, where, doc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'

export default function AffiliateDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();

  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false);

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

  const isLoading = isAuthLoading || profileLoading;

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
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                <AvatarImage src={profile?.photoUrl} className="object-cover" />
                <AvatarFallback className="bg-primary text-white text-3xl font-black">
                  {profile?.firstName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={() => setIsEditingPhoto(true)}
                className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full shadow-lg border hover:bg-slate-50 transition-all"
              >
                <Camera className="h-4 w-4 text-primary" />
              </button>
            </div>
            <div>
              <h1 className="text-3xl font-headline font-black text-slate-900 leading-tight">
                {t.welcomeBack}, {profile?.firstName || 'Campeón'} 👋
              </h1>
              <p className="text-slate-500 font-bold text-sm tracking-wide flex items-center gap-2">
                 <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Panel de Control Verificado
              </p>
            </div>
          </div>
          <Alert className="md:max-w-sm border-none bg-white shadow-sm rounded-2xl py-4 border-l-4 border-primary">
            <div className="flex items-start gap-3">
               <CalendarClock className="h-6 w-6 text-primary mt-1" />
               <div>
                 <AlertTitle className="text-sm font-black text-slate-900">{t.weeklyPayments}</AlertTitle>
                 <AlertDescription className="text-xs text-slate-500 font-medium">
                   {t.weeklyPaymentsNotice}
                 </AlertDescription>
               </div>
            </div>
          </Alert>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[1.5rem] bg-white group overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-slate-200 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
            <CardHeader className="px-8 py-6 border-b border-slate-50">
              <CardTitle className="text-xl font-headline font-black text-slate-900">Ventas Recientes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {salesLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
              ) : !sales || sales.length === 0 ? (
                <div className="text-center py-24">
                  <ShoppingBag className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold text-sm">Tu primer venta está por llegar. ¡Sigue así!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="px-8 uppercase text-[10px] font-black text-slate-400 tracking-widest">ID</TableHead>
                        <TableHead className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Producto</TableHead>
                        <TableHead className="uppercase text-[10px] font-black text-slate-400 tracking-widest">Monto</TableHead>
                        <TableHead className="px-8 text-right uppercase text-[10px] font-black text-slate-400 tracking-widest">Comisión</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.slice(0, 5).map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-slate-50/30 transition-colors h-16">
                          <TableCell className="px-8 font-mono text-xs font-bold text-slate-300">#{sale.id.substring(0, 8)}</TableCell>
                          <TableCell className="font-bold text-slate-700">{sale.productName || sale.productId}</TableCell>
                          <TableCell className="font-bold text-slate-500">${sale.saleAmount?.toFixed(2)}</TableCell>
                          <TableCell className="px-8 text-right font-black text-primary">${sale.commissionEarned?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4">
              <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
                <Landmark className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl font-headline font-black">Cobros Bancarios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.bankName}</p>
                <p className="font-bold text-lg">{profile?.bankId || 'Sin registrar'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.accountNumber}</p>
                <p className="font-black font-mono tracking-widest text-lg text-primary">
                  {profile?.bankAccountNumber || '--- --- ---'}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
                  * Recuerda mantener tus datos bancarios actualizados para recibir tus pagos sin demora.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditingPhoto} onOpenChange={setIsEditingPhoto}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-headline font-black">{t.updatePhoto}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label className="font-bold text-slate-700">{t.photoUrlLabel}</Label>
              <Input 
                placeholder="https://enlace-a-tu-foto.jpg"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditingPhoto(false)}>Cancelar</Button>
            <Button onClick={handleUpdatePhoto} className="font-black px-8">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}

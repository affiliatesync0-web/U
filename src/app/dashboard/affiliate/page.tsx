
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BadgeDollarSign, ShoppingBag, TrendingUp, Users, Loader2, Landmark, CalendarClock, ShieldAlert, User, Camera } from 'lucide-react'
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
      title: t.language === 'es' ? "Foto actualizada" : "Photo updated",
      description: t.language === 'es' ? "Tu foto de perfil ha sido cambiada." : "Your profile picture has been changed.",
    });
    setIsEditingPhoto(false);
  };

  const totalCommissions = sales?.reduce((acc, s) => acc + (s.commissionEarned || 0), 0) || 0;

  const stats = [
    { title: t.balance, value: `$${profile?.currentBalance?.toFixed(2) || '0.00'}`, icon: BadgeDollarSign, color: "text-green-600", bg: "bg-green-100" },
    { title: t.totalSales, value: sales?.length.toString() || '0', icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Comisiones Totales", value: `$${totalCommissions.toFixed(2)}`, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "Estado Cuenta", value: profile?.status === 'Blocked' ? t.blockedStatus : (profile?.status || t.active), icon: Users, color: profile?.status === 'Blocked' ? "text-red-600" : "text-violet-600", bg: profile?.status === 'Blocked' ? "bg-red-100" : "bg-violet-100" },
  ]

  if (isLoading) {
    return (
      <DashboardShell role="affiliate">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  if (profile?.status === 'Blocked') {
    return (
      <DashboardShell role="affiliate">
        <div className="space-y-8">
          <Alert variant="destructive" className="border-red-600 bg-red-50 py-12 shadow-xl rounded-[2rem]">
            <ShieldAlert className="h-12 w-12" />
            <AlertTitle className="text-3xl font-bold mb-3">{t.blockedAccount}</AlertTitle>
            <AlertDescription className="text-xl leading-relaxed">
              {t.blockedMessage}
            </AlertDescription>
          </Alert>
          
          <div className="opacity-30 pointer-events-none grayscale">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => (
                <Card key={stat.title} className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <div className={`p-3 rounded-xl w-fit ${stat.bg} ${stat.color}`}><stat.icon className="h-6 w-6" /></div>
                    <p className="mt-4 text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <h3 className="text-2xl font-bold font-headline mt-1">{stat.value}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="relative group">
              <Avatar className="h-28 w-28 border-4 border-white shadow-2xl transition-transform hover:scale-105 duration-500">
                <AvatarImage src={profile?.photoUrl} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-4xl font-bold">
                  {profile?.firstName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Dialog open={isEditingPhoto} onOpenChange={setIsEditingPhoto}>
                <DialogTrigger asChild>
                  <button className="absolute bottom-1 right-1 bg-white p-2.5 rounded-full shadow-xl border hover:bg-slate-50 transition-all transform hover:rotate-12">
                    <Camera className="h-5 w-5 text-primary" />
                  </button>
                </DialogTrigger>
                <DialogContent className="rounded-[2rem]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-headline font-bold">{t.updatePhoto}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-6">
                    <div className="space-y-3">
                      <Label htmlFor="photoUrl" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t.photoUrlLabel}</Label>
                      <Input 
                        id="photoUrl" 
                        placeholder={t.photoPlaceholder}
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        className="h-12 rounded-xl"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => setIsEditingPhoto(false)} className="rounded-xl h-12">
                      {t.cancel}
                    </Button>
                    <Button onClick={handleUpdatePhoto} className="bg-primary rounded-xl h-12 px-8 font-bold text-white">
                      {t.saveChanges}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BadgeDollarSign className="h-4 w-4 text-green-500" />
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-[0.2em]">Panel Verificado</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary leading-tight tracking-tight">
                {t.welcomeBack}, {profile?.firstName || 'Afiliado'}
              </h1>
              <p className="text-slate-500 font-medium">Gestiona tus ventas y supervisa tus comisiones semanales.</p>
            </div>
          </div>
          <Alert className="md:max-w-sm border-primary/20 bg-primary/5 rounded-[1.5rem] py-6 shadow-sm border-l-[6px] border-l-primary">
            <CalendarClock className="h-6 w-6 text-primary" />
            <div className="ml-2">
              <AlertTitle className="text-xs font-bold text-primary uppercase tracking-[0.1em] mb-1">{t.weeklyPayments}</AlertTitle>
              <AlertDescription className="text-xs text-slate-600 font-medium leading-relaxed">
                {t.weeklyPaymentsNotice}
              </AlertDescription>
            </div>
          </Alert>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden rounded-[1.75rem] bg-white group border border-slate-50">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-500 shadow-sm`}>
                    <stat.icon className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-bold font-headline text-slate-900">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          <Card className="lg:col-span-2 border-none shadow-sm rounded-[2rem] bg-white border border-slate-50 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b px-8 py-6">
              <CardTitle className="text-xl font-headline font-bold text-slate-800">Actividad de Ventas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {salesLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
              ) : !sales || sales.length === 0 ? (
                <div className="text-center py-24 text-slate-400 flex flex-col items-center gap-4">
                  <ShoppingBag className="h-12 w-12 opacity-10" />
                  <p className="font-medium text-sm">Aún no has registrado ninguna venta real.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/30">
                        <TableHead className="px-8 h-12 uppercase text-[10px] font-bold tracking-widest">ID Transacción</TableHead>
                        <TableHead className="h-12 uppercase text-[10px] font-bold tracking-widest">Producto</TableHead>
                        <TableHead className="h-12 uppercase text-[10px] font-bold tracking-widest">{t.amount}</TableHead>
                        <TableHead className="px-8 h-12 text-right uppercase text-[10px] font-bold tracking-widest">{t.commission}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.slice(0, 10).map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="px-8 font-mono text-xs font-bold text-muted-foreground">#{sale.id.substring(0, 8)}</TableCell>
                          <TableCell className="font-semibold text-slate-800">{sale.productName || sale.productId}</TableCell>
                          <TableCell className="font-medium text-slate-600">${sale.saleAmount?.toFixed(2)}</TableCell>
                          <TableCell className="px-8 text-right font-bold text-primary tracking-tight">${sale.commissionEarned?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-gradient-to-br from-primary to-primary/80 text-white rounded-[2rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-3 px-8 pt-8 pb-4">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm"><Landmark className="h-5 w-5" /></div>
              <CardTitle className="text-xl font-headline font-bold">{t.payoutInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-8 pb-10">
              <div className="bg-white/10 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                <p className="text-[9px] uppercase tracking-[0.2em] opacity-60 mb-1 font-bold">{t.bankName}</p>
                <p className="font-bold text-lg">{profile?.bankId || 'Sin registrar'}</p>
              </div>
              <div className="bg-white/10 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                <p className="text-[9px] uppercase tracking-[0.2em] opacity-60 mb-1 font-bold">{t.accountNumber}</p>
                <p className="font-bold font-mono tracking-widest text-lg">
                  {profile?.bankAccountNumber ? profile.bankAccountNumber : 'Sin registrar'}
                </p>
              </div>
              <div className="bg-white/10 p-5 rounded-2xl border border-white/5 backdrop-blur-md">
                <p className="text-[9px] uppercase tracking-[0.2em] opacity-60 mb-1 font-bold">{t.accountHolder}</p>
                <p className="font-bold text-sm tracking-tight">{profile?.bankAccountHolderName || 'Sin registrar'}</p>
              </div>
              <div className="pt-4 px-2">
                <div className="flex items-start gap-2 p-4 bg-black/10 rounded-xl border border-white/5">
                  <CalendarClock className="h-4 w-4 shrink-0 opacity-70 mt-0.5" />
                  <p className="text-[10px] font-medium leading-relaxed opacity-90">
                    * {t.weeklyPaymentsNotice}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

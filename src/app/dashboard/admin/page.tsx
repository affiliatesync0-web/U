
"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Users, ShoppingBag, Wallet, Activity, Loader2, UserCheck, TrendingUp, RefreshCcw, AlertTriangle, Bell, MessageSquare } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase'
import { collection, doc, getDocs, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    // Solicitar permiso de notificaciones al Administrador
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (db && user) {
      const now = new Date();
      
      // 1. Escuchar mensajes nuevos en la Comunidad
      const qComm = query(
        collection(db, 'community_messages'), 
        orderBy('createdAt', 'desc'), 
        limit(1)
      );
      
      const unsubscribeComm = onSnapshot(qComm, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const msg = change.doc.data();
            // Evitar notificar si el mensaje es del admin o es antiguo (de antes de cargar la pág)
            const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
            if (msg.userName !== "ADMINISTRADOR" && msgDate > now) {
              toast({ 
                title: `💬 Comunidad: ${msg.userName}`, 
                description: msg.content,
                action: <Button variant="outline" size="sm" className="h-8 rounded-lg font-black text-[10px] uppercase" onClick={() => router.push('/dashboard/admin/support')}>VER CHAT</Button>
              });
              if (Notification.permission === "granted") {
                new Notification(`Sync Grupo: ${msg.userName}`, { body: msg.content });
              }
            }
          }
        });
      });

      // 2. Escuchar mensajes privados para el admin
      const qPriv = query(
        collection(db, 'private_messages'), 
        where('receiverId', '==', 'affiliatesync0@gmail.com'),
        orderBy('createdAt', 'desc'), 
        limit(1)
      );
      
      const unsubscribePriv = onSnapshot(qPriv, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const msg = change.doc.data();
            const msgDate = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
            if (msgDate > now) {
              toast({ 
                variant: "default",
                title: `📩 Privado de ${msg.userName}`, 
                description: msg.content,
                action: <Button variant="outline" size="sm" className="h-8 rounded-lg font-black text-[10px] uppercase" onClick={() => router.push('/dashboard/admin/support')}>RESPONDER</Button>
              });
              if (Notification.permission === "granted") {
                new Notification(`Mensaje Privado: ${msg.userName}`, { body: msg.content });
              }
            }
          }
        });
      });

      return () => {
        unsubscribeComm();
        unsubscribePriv();
      };
    }
  }, [db, user, toast, router]);

  const salesQuery = useMemoFirebase(() => {
    if (!db || isAuthLoading || !user) return null;
    return collection(db, 'sales');
  }, [db, user, isAuthLoading]);
  
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  const affiliatesQuery = useMemoFirebase(() => {
    if (!db || isAuthLoading || !user) return null;
    return collection(db, 'affiliates');
  }, [db, user, isAuthLoading]);
  
  const { data: affiliates, isLoading: affiliatesLoading } = useCollection(affiliatesQuery);

  const buyersQuery = useMemoFirebase(() => {
    if (!db || isAuthLoading || !user) return null;
    return collection(db, 'buyers');
  }, [db, user, isAuthLoading]);
  
  const { data: buyers, isLoading: buyersLoading } = useCollection(buyersQuery);

  const totalRevenue = sales?.reduce((acc, sale) => acc + (sale.saleAmount || 0), 0) || 0;
  const totalSalesCount = sales?.length || 0;
  const activeAffiliatesCount = affiliates?.length || 0;
  const totalBuyersCount = buyers?.length || 0;
  
  const stats = [
    { title: t.totalRevenue, value: `$${totalRevenue.toLocaleString()}`, icon: Wallet, color: "text-primary", bg: "bg-primary/5" },
    { title: "Afiliados Activos", value: activeAffiliatesCount.toString(), icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Total Compradores", value: totalBuyersCount.toString(), icon: UserCheck, color: "text-green-500", bg: "bg-green-50" },
    { title: "Ventas Totales", value: totalSalesCount.toString(), icon: ShoppingBag, color: "text-purple-500", bg: "bg-purple-50" },
  ]

  const chartData = [
    { name: "Enero", sales: totalSalesCount * 0.4 },
    { name: "Febrero", sales: totalSalesCount * 0.6 },
    { name: "Marzo", sales: totalSalesCount },
  ]

  const chartConfig = {
    sales: {
      label: t.totalSales,
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  const handleResetSystem = async () => {
    if (!db) return;
    setResetting(true);
    
    try {
      const salesSnap = await getDocs(collection(db, 'sales'));
      const affSnap = await getDocs(collection(db, 'affiliates'));
      
      salesSnap.docs.forEach(d => {
        deleteDocumentNonBlocking(doc(db, 'sales', d.id));
      });

      affSnap.docs.forEach(d => {
        updateDocumentNonBlocking(doc(db, 'affiliates', d.id), { currentBalance: 0 });
      });

      toast({
        title: t.language === 'es' ? "Sistema Reiniciado" : "System Reset",
        description: t.language === 'es' ? "Se han borrado las ventas y reseteado los saldos." : "Sales have been cleared and balances reset.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo completar el reinicio total.",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight">{t.networkOverview}</h1>
            <p className="text-slate-500 font-medium">{t.manageNetwork}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-100">
             <TrendingUp className="h-4 w-4 text-green-600" />
             <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Plataforma en Crecimiento</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-xl rounded-[2.5rem] bg-white group hover:scale-[1.02] transition-all">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} shadow-inner`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="h-2 w-2 rounded-full bg-slate-100 group-hover:bg-primary transition-colors" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-8 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
            <CardHeader className="px-10 py-8 border-b bg-slate-50/30">
              <CardTitle className="text-2xl font-headline font-black text-slate-900 tracking-tight">Rendimiento de Ventas</CardTitle>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-400 mt-1">Histórico de transacciones registradas</CardDescription>
            </CardHeader>
            <CardContent className="p-10">
               {salesLoading || isAuthLoading ? (
                 <div className="flex justify-center py-24"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-50" /></div>
               ) : (
                 <ChartContainer config={chartConfig} className="min-h-[350px] w-full">
                    <BarChart data={chartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                      <YAxis tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="sales" fill="var(--color-sales)" radius={[10, 10, 0, 0]} />
                    </BarChart>
                 </ChartContainer>
               )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-4 border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden flex flex-col">
            <CardHeader className="p-10">
              <CardTitle className="text-xl font-headline font-black text-primary uppercase tracking-widest">{t.recentAffiliates}</CardTitle>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Nuevos registros en la red</p>
            </CardHeader>
            <CardContent className="px-10 flex-1">
              <div className="space-y-6">
                {affiliatesLoading || isAuthLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
                ) : affiliates && affiliates.length > 0 ? (
                  affiliates.slice(0, 6).map((aff) => (
                    <div key={aff.id} className="flex items-center justify-between p-4 rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-black text-sm rotate-3">
                          {aff.firstName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">{aff.firstName} {aff.lastName}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{aff.status || 'Active'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-slate-600">
                    <Users className="h-10 w-10 mx-auto mb-4 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Sin registros todavía</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] bg-amber-50 border border-amber-100 overflow-hidden">
          <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 bg-amber-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-amber-200">
                <RefreshCcw className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-headline font-black text-amber-900 tracking-tight">{t.resetSystem}</h3>
                <p className="text-amber-700 font-medium max-w-lg">{t.resetSystemDesc}</p>
              </div>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="h-16 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-destructive/20 hover:scale-105 transition-all"
                  disabled={resetting}
                >
                  {resetting ? <Loader2 className="animate-spin mr-2" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                  {t.resetSystem.toUpperCase()}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[3rem] p-10 border-none shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-3xl font-headline font-black text-slate-900 tracking-tight leading-tight">
                    {t.confirmResetTitle}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500 font-bold leading-relaxed mt-4">
                    {t.confirmResetDesc}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-10 gap-4">
                  <AlertDialogCancel className="h-14 rounded-2xl font-black text-slate-400 border-slate-100">CANCELAR</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetSystem} className="h-14 rounded-2xl bg-destructive text-white font-black shadow-xl shadow-destructive/20">
                    SÍ, REINICIAR TODO
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

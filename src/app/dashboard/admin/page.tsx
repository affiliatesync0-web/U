
"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, Wallet, Loader2, TrendingUp, RefreshCcw, AlertTriangle, Bell, MessageSquare } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc, getDocs, query, onSnapshot, limit } from 'firebase/firestore'
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
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (mounted && db && user) {
      const now = new Date().toISOString();
      const qComm = query(collection(db, 'community_messages'), limit(1));
      
      const unsubscribeComm = onSnapshot(qComm, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const msg = change.doc.data();
            if (msg.userName !== "ADMINISTRADOR" && msg.createdAt > now) {
              toast({ 
                title: `💬 Comunidad: ${msg.userName}`, 
                description: msg.content,
                action: <Button variant="outline" size="sm" className="h-8 rounded-lg font-black text-[10px] uppercase" onClick={() => router.push('/dashboard/admin/support')}>VER</Button>
              });
              
              if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                try {
                  new Notification(`Sync Grupo: ${msg.userName}`, { body: msg.content });
                } catch (e) {
                  console.error("Error al mostrar notificación:", e);
                }
              }
            }
          }
        });
      });

      return () => unsubscribeComm();
    }
  }, [mounted, db, user, toast, router]);

  const salesQuery = useMemoFirebase(() => (!db || isAuthLoading || !user) ? null : collection(db, 'sales'), [db, user, isAuthLoading]);
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  if (!mounted) return null;

  const stats = [
    { title: t.totalRevenue, value: `$${(sales || []).reduce((acc, s) => acc + (s.saleAmount || 0), 0).toLocaleString()}`, icon: Wallet, color: "text-primary", bg: "bg-primary/5" },
    { title: "Ventas Totales", value: (sales || []).length.toString(), icon: ShoppingBag, color: "text-purple-500", bg: "bg-purple-50" },
  ]

  const chartData = [
    { name: "Ene", sales: ((sales || []).length) * 0.4 },
    { name: "Feb", sales: ((sales || []).length) * 0.6 },
    { name: "Mar", sales: ((sales || []).length) },
  ]

  const handleRequestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        toast({ title: "Notificaciones Activas", description: "Recibirás alertas en tiempo real." });
      }
    }
  };

  const handleResetSystem = async () => {
    if (!db) return;
    setResetting(true);
    try {
      const salesSnap = await getDocs(collection(db, 'sales'));
      salesSnap.docs.forEach(d => deleteDocumentNonBlocking(doc(db, 'sales', d.id)));
      toast({ title: "Sistema Reiniciado" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
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
          <div className="flex items-center gap-3">
            {notifPermission !== 'granted' && (
              <Button onClick={handleRequestPermission} variant="outline" className="h-10 px-4 rounded-xl border-amber-200 text-amber-600 text-[9px] font-black uppercase">
                <Bell className="mr-2 h-3 w-3" /> Habilitar Notificaciones
              </Button>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border border-green-100">
               <TrendingUp className="h-4 w-4 text-green-600" />
               <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">En Crecimiento</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-xl rounded-[2.5rem] bg-white hover:scale-[1.02] transition-all">
              <CardContent className="p-8">
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-inner`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-8 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
            <CardHeader className="px-10 py-8 border-b bg-slate-50/30">
              <CardTitle className="text-2xl font-headline font-black text-slate-900 tracking-tight">Rendimiento</CardTitle>
            </CardHeader>
            <CardContent className="p-10">
               <ChartContainer config={{ sales: { label: "Ventas", color: "hsl(var(--primary))" } }} className="min-h-[300px]">
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeOpacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800}} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sales" fill="var(--color-sales)" radius={[8, 8, 0, 0]} />
                  </BarChart>
               </ChartContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-4 border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white p-10 overflow-hidden">
            <div className="space-y-6">
              <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl"><Bell className="h-6 w-6" /></div>
              <h3 className="text-2xl font-headline font-black uppercase">Alertas Activas</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">Recibe avisos cada vez que un socio solicite aprobación o envíe un mensaje.</p>
              <Button onClick={handleRequestPermission} variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-white font-black text-[10px] uppercase">HABILITAR AHORA</Button>
            </div>
          </Card>
        </div>

        <Card className="border-none shadow-2xl rounded-[3rem] bg-amber-50 border border-amber-100 p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-amber-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl"><RefreshCcw className="h-8 w-8" /></div>
            <div>
              <h3 className="text-2xl font-headline font-black text-amber-900">{t.resetSystem}</h3>
              <p className="text-amber-700 font-medium max-w-lg">Limpia el historial de transacciones y resetea saldos.</p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="h-16 px-10 rounded-2xl font-black text-xs uppercase shadow-xl" disabled={resetting}>
                {resetting ? <Loader2 className="animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />} REINICIAR TODO
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[3rem] p-10 border-none shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-3xl font-headline font-black">¿Confirmar Reinicio?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 font-bold mt-4">Esta acción borrará todas las ventas y saldos permanentemente.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-10 gap-4">
                <AlertDialogCancel className="h-14 rounded-2xl font-black">CANCELAR</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetSystem} className="h-14 rounded-2xl bg-destructive text-white font-black">SÍ, REINICIAR</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      </div>
    </DashboardShell>
  )
}

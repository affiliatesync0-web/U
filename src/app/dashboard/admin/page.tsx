
"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag, Wallet, Loader2, TrendingUp, RefreshCcw, AlertTriangle, Bell, MessageSquare, Users, Trash2, UserMinus } from 'lucide-react'
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

  const totalRevenue = (sales || []).reduce((acc, s) => acc + (s.saleAmount || 0), 0);

  const stats = [
    { title: t.totalRevenue, value: `$${totalRevenue.toLocaleString()}`, icon: Wallet, color: "text-primary", bg: "bg-primary/5" },
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
      toast({ title: "Sistema Reiniciado", description: "Se han borrado todas las ventas del registro." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setResetting(false);
    }
  };

  const handleResetAffiliates = async () => {
    if (!db) return;
    setResetting(true);
    try {
      const snap = await getDocs(collection(db, 'affiliates'));
      snap.docs.forEach(d => deleteDocumentNonBlocking(doc(db, 'affiliates', d.id)));
      toast({ title: "Directorio Limpio", description: "Todos los afiliados han sido eliminados de la base de datos." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error al borrar socios" });
    } finally {
      setResetting(false);
    }
  };

  const handleCleanupInactiveAffiliates = async () => {
    if (!db) return;
    setResetting(true);
    try {
      // 1. Obtener IDs de afiliados que tienen al menos un referido
      const buyersSnap = await getDocs(collection(db, 'buyers'));
      const activeReferrerIds = new Set(buyersSnap.docs.map(d => d.data().referredBy).filter(id => !!id));

      // 2. Obtener todos los afiliados
      const affiliatesSnap = await getDocs(collection(db, 'affiliates'));
      let deletedCount = 0;

      for (const affDoc of affiliatesSnap.docs) {
        const affId = affDoc.id;
        const affData = affDoc.data();
        
        // No borrar la cuenta administrativa
        if (affData.email === 'affiliatesync0@gmail.com') continue;

        // Borrar si no tiene referidos activos
        if (!activeReferrerIds.has(affId)) {
          deleteDocumentNonBlocking(doc(db, 'affiliates', affId));
          deletedCount++;
        }
      }

      toast({ 
        title: "Limpieza Completada", 
        description: `Se han eliminado ${deletedCount} socios sin actividad registrada.` 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error en la limpieza selectiva" });
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
            <Card key={stat.title} className="border-none shadow-xl rounded-[2.5rem] bg-white hover:scale-[1.02] transition-all ring-1 ring-slate-100">
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
              <CardTitle className="text-2xl font-headline font-black text-slate-900 tracking-tight">Rendimiento Comercial</CardTitle>
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

          <Card className="lg:col-span-4 border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white p-10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Bell className="h-48 w-48 text-primary" />
            </div>
            <div className="space-y-6 relative z-10">
              <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl"><Bell className="h-6 w-6" /></div>
              <h3 className="text-2xl font-headline font-black uppercase">Alertas en Vivo</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">Mantente al tanto de cada solicitud de aprobación y mensajes de la comunidad.</p>
              <Button onClick={handleRequestPermission} variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">HABILITAR AHORA</Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-amber-50 border border-amber-100 p-10 flex flex-col items-center justify-between gap-8 group">
              <div className="flex items-center gap-6 w-full">
                <div className="h-16 w-16 bg-amber-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shrink-0 -rotate-3 transition-transform group-hover:rotate-0"><RefreshCcw className="h-8 w-8" /></div>
                <div>
                  <h3 className="text-2xl font-headline font-black text-amber-900">{t.resetSystem}</h3>
                  <p className="text-amber-700 font-medium text-sm">Limpia el historial de ventas y reinicia los registros.</p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full h-16 rounded-2xl font-black text-xs uppercase shadow-xl" disabled={resetting}>
                    {resetting ? <Loader2 className="animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />} REINICIAR REGISTRO DE VENTAS
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[3rem] p-10 border-none shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-3xl font-headline font-black">¿Confirmar Reinicio?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-500 font-bold mt-4">Esta acción borrará todas las transacciones grabadas de forma permanente.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-10 gap-4">
                    <AlertDialogCancel className="h-14 rounded-2xl font-black">CANCELAR</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetSystem} className="h-14 rounded-2xl bg-destructive text-white font-black">SÍ, REINICIAR VENTAS</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>

            <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 border border-slate-800 p-10 flex flex-col items-center justify-between gap-8 group">
              <div className="flex items-center gap-6 w-full">
                <div className="h-16 w-16 bg-primary text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shrink-0 -rotate-3 transition-transform group-hover:rotate-0"><UserMinus className="h-8 w-8" /></div>
                <div>
                  <h3 className="text-2xl font-headline font-black text-white">Depuración Selectiva</h3>
                  <p className="text-slate-400 font-medium text-sm">Elimina socios que no han generado ningún comprador.</p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full h-16 rounded-2xl font-black text-xs uppercase shadow-xl border-white/10 text-white hover:bg-white/5" disabled={resetting}>
                    {resetting ? <Loader2 className="animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} DEPURAR SOCIOS SIN ACTIVIDAD
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[3rem] p-10 border-none shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-3xl font-headline font-black">¿Eliminar socios inactivos?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-500 font-bold mt-4">Solo se borrarán los afiliados que **no tengan referidos** registrados. Los socios productivos permanecerán intactos.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-10 gap-4">
                    <AlertDialogCancel className="h-14 rounded-2xl font-black">CANCELAR</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCleanupInactiveAffiliates} className="h-14 rounded-2xl bg-slate-900 text-white font-black">SÍ, LIMPIAR RED</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          </div>

          <Card className="border-none shadow-2xl rounded-[3rem] bg-red-100 border border-red-200 p-10 flex flex-col md:flex-row items-center justify-between gap-8 group">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 bg-red-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl rotate-3 transition-transform group-hover:rotate-0"><Users className="h-8 w-8" /></div>
              <div>
                <h3 className="text-2xl font-headline font-black text-red-900">Limpieza Total de Socios</h3>
                <p className="text-red-700 font-medium max-w-lg">Borra **todos** los perfiles de afiliados de la base de datos central.</p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="h-16 px-10 rounded-2xl font-black text-xs uppercase shadow-xl bg-red-600 hover:bg-red-700" disabled={resetting}>
                  {resetting ? <Loader2 className="animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} BORRAR DIRECTORIO COMPLETO
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[3rem] p-10 border-none shadow-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-3xl font-headline font-black">¿Eliminar toda la red?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500 font-bold mt-4">Se borrarán todos los perfiles, datos bancarios y saldos. Esta acción es definitiva.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-10 gap-4">
                  <AlertDialogCancel className="h-14 rounded-2xl font-black">CANCELAR</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAffiliates} className="h-14 rounded-2xl bg-destructive text-white font-black">SÍ, BORRAR TODO</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

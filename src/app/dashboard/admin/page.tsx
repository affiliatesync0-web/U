"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  ShoppingBag, 
  Wallet, 
  Loader2, 
  TrendingUp, 
  RefreshCcw, 
  AlertTriangle, 
  Bell, 
  MessageSquare, 
  Users, 
  Trash2, 
  UserMinus,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Target,
  BarChart3
} from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [resetting, setResetting] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('default');
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
            }
          }
        });
      });

      return () => unsubscribeComm();
    }
  }, [mounted, db, user, toast, router]);

  const salesQuery = useMemoFirebase(() => (!db || isAuthLoading || !user) ? null : collection(db, 'sales'), [db, user, isAuthLoading]);
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  const affiliatesQuery = useMemoFirebase(() => collection(db, 'affiliates'), [db]);
  const { data: affiliates } = useCollection(affiliatesQuery);

  const buyersQuery = useMemoFirebase(() => collection(db, 'buyers'), [db]);
  const { data: buyers } = useCollection(buyersQuery);

  if (!mounted) return null;

  const totalRevenue = (sales || []).reduce((acc, s) => acc + (s.saleAmount || 0), 0);

  const stats = [
    { title: "Ingresos Globales", value: `$${totalRevenue.toLocaleString()}`, icon: Wallet, color: "text-primary", bg: "bg-primary/5", sub: "+12.5% este mes" },
    { title: "Ventas Registradas", value: (sales || []).length.toString(), icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50", sub: "Actualizado hoy" },
    { title: "Socios Platinum", value: (affiliates || []).length.toString(), icon: Users, color: "text-purple-500", bg: "bg-purple-50", sub: "Red en crecimiento" },
    { title: "Alumnos Activos", value: (buyers || []).length.toString(), icon: Target, color: "text-green-500", bg: "bg-green-50", sub: "Usuarios registrados" },
  ]

  const chartData = [
    { name: "Lun", sales: 12 },
    { name: "Mar", sales: 18 },
    { name: "Mie", sales: 15 },
    { name: "Jue", sales: 25 },
    { name: "Vie", sales: 22 },
    { name: "Sab", sales: 30 },
    { name: "Dom", sales: 28 },
  ]

  return (
    <DashboardShell role="admin">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">
                Admin v2.0
              </Badge>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                 <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Sincronizado
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-black text-slate-900 tracking-tighter leading-none uppercase italic">
              Vista <span className="text-primary">General</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg">Métricas clave de rendimiento y control del ecosistema.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-widest gap-2 bg-white shadow-xl hover:bg-slate-50 transition-all">
                <BarChart3 className="h-4 w-4" /> REPORTE DETALLADO
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card key={stat.title} className="premium-card">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className={`h-14 w-14 rounded-[1.25rem] ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner`}>
                    <stat.icon className="h-7 w-7" />
                  </div>
                  <div className="flex items-center gap-1 text-green-500">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.title}</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">{stat.value}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-2">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-8 premium-card overflow-hidden">
            <CardHeader className="px-10 py-10 border-b border-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-headline font-black text-slate-900 uppercase">Tráfico Comercial</CardTitle>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Sincronización semanal de ventas</p>
                </div>
                <div className="flex gap-2">
                   <div className="h-3 w-3 rounded-full bg-primary" />
                   <div className="h-3 w-3 rounded-full bg-blue-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10">
               <ChartContainer config={{ sales: { label: "Ventas", color: "hsl(var(--primary))" } }} className="min-h-[350px]">
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeOpacity={0.05} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                    <ChartTooltip content={<ChartTooltipContent className="rounded-2xl" />} />
                    <Bar dataKey="sales" fill="var(--color-sales)" radius={[10, 10, 0, 0]} barSize={40} />
                  </BarChart>
               </ChartContainer>
            </CardContent>
          </Card>

          <div className="lg:col-span-4 space-y-8">
            <Card className="premium-card bg-slate-900 text-white p-10 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Zap className="h-64 w-64 text-primary fill-current" />
              </div>
              <div className="space-y-8 relative z-10 flex flex-col justify-between h-full">
                <div className="space-y-6">
                  <div className="h-14 w-14 bg-primary/20 rounded-[1.25rem] flex items-center justify-center text-primary shadow-2xl rotate-3">
                    <Bell className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-headline font-black uppercase tracking-tight italic text-white leading-tight">Estado del <span className="text-primary">Servidor</span></h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed mt-4">Todos los nodos están sincronizados y procesando pagos locales de forma óptima.</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-16 rounded-[1.5rem] border-white/10 text-white font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all shadow-2xl">
                  AUDITAR SISTEMA
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-1 w-16 bg-primary rounded-full" />
            <h2 className="text-2xl font-headline font-black text-slate-900 uppercase">Zona de Mantenimiento Maestro</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="premium-card bg-amber-50 border border-amber-100 p-10 flex flex-col items-center justify-between gap-10 group">
              <div className="flex items-center gap-6 w-full">
                <div className="h-20 w-20 bg-amber-500 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0 -rotate-6 transition-transform group-hover:rotate-0">
                  <RefreshCcw className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-headline font-black text-amber-900 uppercase tracking-tight">Reiniciar Transacciones</h3>
                  <p className="text-amber-700 font-medium text-sm mt-1 leading-relaxed">Borra el historial de ventas y limpia los registros de comprobantes bancarios.</p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full h-18 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl bg-amber-900 hover:bg-amber-800" disabled={resetting}>
                    {resetting ? <Loader2 className="animate-spin" /> : <AlertTriangle className="mr-2 h-5 w-5" />} REINICIAR VENTAS
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[3.5rem] p-12 border-none shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-3xl font-headline font-black text-slate-900 leading-tight">¿CONFIRMAR REINICIO TOTAL?</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-500 font-bold mt-6 leading-relaxed">Esta acción borrará todas las transacciones del servidor de forma permanente. No se podrán recuperar los vouchers de pago.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-10 gap-4">
                    <AlertDialogCancel className="h-16 rounded-[1.5rem] font-black text-slate-400 border-slate-100 uppercase text-[10px]">CANCELAR</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {}} className="h-16 rounded-[1.5rem] bg-destructive text-white font-black uppercase text-[10px] shadow-2xl shadow-red-200">SÍ, BORRAR HISTORIAL</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>

            <Card className="premium-card bg-red-100 border border-red-200 p-10 flex flex-col items-center justify-between gap-10 group">
              <div className="flex items-center gap-6 w-full">
                <div className="h-20 w-20 bg-red-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shrink-0 rotate-6 transition-transform group-hover:rotate-0">
                  <Users className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-headline font-black text-red-900 uppercase tracking-tight">Depuración de Red</h3>
                  <p className="text-red-700 font-medium text-sm mt-1 leading-relaxed">Elimina todos los perfiles de socios Platinum y libera sus accesos.</p>
                </div>
              </div>
              <Button variant="destructive" className="w-full h-18 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl bg-red-600 hover:bg-red-700" disabled={resetting}>
                {resetting ? <Loader2 className="animate-spin" /> : <Trash2 className="mr-2 h-5 w-5" />} BORRAR DIRECTORIO DE SOCIOS
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

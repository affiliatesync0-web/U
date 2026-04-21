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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      </div>
    </DashboardShell>
  )
}

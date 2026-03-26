
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Users, ShoppingBag, Wallet, Activity, Loader2, UserCheck, TrendingUp } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { collection } from 'firebase/firestore'

export default function AdminDashboard() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
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
      </div>
    </DashboardShell>
  )
}

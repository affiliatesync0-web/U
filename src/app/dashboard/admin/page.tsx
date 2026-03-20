"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Users, ShoppingBag, Wallet, Activity, Loader2 } from 'lucide-react'
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

  const totalRevenue = sales?.reduce((acc, sale) => acc + (sale.saleAmount || 0), 0) || 0;
  const totalSalesCount = sales?.length || 0;
  const activeAffiliatesCount = affiliates?.length || 0;
  
  const stats = [
    { title: t.totalRevenue, value: `$${totalRevenue.toLocaleString()}`, icon: Wallet, color: "text-[#2870A3]", change: "Real" },
    { title: t.totalSales, value: totalSalesCount.toString(), icon: ShoppingBag, color: "text-[#A37EDC]", change: "Real" },
    { title: t.activeAffiliates, value: activeAffiliatesCount.toString(), icon: Users, color: "text-blue-500", change: "Real" },
    { title: t.conversionRate, value: totalSalesCount > 0 ? "Activo" : "Sin Datos", icon: Activity, color: "text-green-500", change: "Estado" },
  ]

  const chartData = [
    { name: "Red de Marketing", sales: totalSalesCount },
  ]

  const chartConfig = {
    sales: {
      label: t.totalSales,
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  return (
    <DashboardShell role="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary mb-2">{t.networkOverview}</h1>
            <p className="text-muted-foreground">{t.manageNetwork}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase">
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold font-headline mt-1">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Resumen de Actividad</CardTitle>
              <CardDescription>Visualización de transacciones reales en la red.</CardDescription>
            </CardHeader>
            <CardContent>
               {salesLoading || isAuthLoading ? (
                 <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
               ) : (
                 <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart data={chartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ChartContainer>
               )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-headline">{t.recentAffiliates}</CardTitle>
              <CardDescription>Últimos registros en la plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {affiliatesLoading || isAuthLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
                ) : affiliates && affiliates.length > 0 ? (
                  affiliates.slice(0, 5).map((aff) => (
                    <div key={aff.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#A37EDC]/20 text-[#A37EDC] flex items-center justify-center font-bold text-xs">
                          {aff.firstName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{aff.firstName} {aff.lastName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{aff.status || 'Activo'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center text-muted-foreground py-10">Sin registros reales todavía.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
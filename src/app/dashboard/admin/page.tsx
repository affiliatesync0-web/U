"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  ShoppingBag, 
  Wallet, 
  Loader2, 
  Users, 
  Target,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Calendar
} from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { collection } from 'firebase/firestore'
import { Badge } from '@/components/ui/badge'

export default function AdminDashboard() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const salesQuery = useMemoFirebase(() => (!db || isAuthLoading || !user) ? null : collection(db, 'sales'), [db, user, isAuthLoading]);
  const { data: sales } = useCollection(salesQuery);

  const affiliatesQuery = useMemoFirebase(() => collection(db, 'affiliates'), [db]);
  const { data: affiliates } = useCollection(affiliatesQuery);

  const buyersQuery = useMemoFirebase(() => collection(db, 'buyers'), [db]);
  const { data: buyers } = useCollection(buyersQuery);

  if (!mounted) return null;

  const totalRevenue = (sales || []).reduce((acc, s) => acc + (s.saleAmount || 0), 0);

  const stats = [
    { title: "Ingresos Totales", value: `$${totalRevenue.toLocaleString()}`, icon: Wallet },
    { title: "Volumen de Ventas", value: (sales || []).length.toString(), icon: BarChart3 },
    { title: "Red de Afiliados", value: (affiliates || []).length.toString(), icon: Users },
    { title: "Cartera de Clientes", value: (buyers || []).length.toString(), icon: Target },
  ]

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistema de Control Central</span>
            </div>
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight uppercase">Resumen <span className="text-slate-400">Ejecutivo</span></h1>
            <p className="text-slate-500 font-medium text-sm">Monitorización de indicadores clave de rendimiento (KPIs).</p>
          </div>
          <Badge variant="outline" className="h-8 px-4 rounded-lg bg-white border-slate-200 font-black text-[10px] uppercase">
            Sincronización: {new Date().toLocaleTimeString()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Card key={i} className="premium-card">
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-900">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-600 opacity-50" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-8 premium-card">
            <CardHeader className="bg-slate-50 border-b p-8">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Últimas Transacciones</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                <p className="text-[10px] font-black uppercase tracking-widest">Esperando flujo de datos...</p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-4 premium-card bg-slate-900 text-white">
            <CardContent className="p-10 space-y-6">
              <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-headline font-black uppercase">Próximos Pagos</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Las solicitudes de liquidación de comisiones se procesan cada viernes a las 18:00 (GMT-6).
                </p>
              </div>
              <div className="pt-4">
                 <div className="p-4 bg-white/5 rounded border border-white/10">
                   <p className="text-[10px] font-black uppercase text-white">Próxima Fecha</p>
                   <p className="text-lg font-black mt-1">28 Febrero, 2024</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BadgeDollarSign, ShoppingBag, TrendingUp, Users, Loader2, Landmark, CalendarClock } from 'lucide-react'
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
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, where, doc } from 'firebase/firestore'

export default function AffiliateDashboard() {
  const { t } = useLanguage();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const db = useFirestore();

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

  const stats = [
    { title: t.balance, value: `$${profile?.currentBalance?.toFixed(2) || '0.00'}`, icon: BadgeDollarSign, color: "text-green-600", bg: "bg-green-100" },
    { title: t.totalSales, value: sales?.length.toString() || '0', icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Comisiones Totales", value: `$${sales?.reduce((acc, s) => acc + (s.commissionEarned || 0), 0).toFixed(2) || '0.00'}`, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "Estado Cuenta", value: profile?.status || 'Activo', icon: Users, color: "text-violet-600", bg: "bg-violet-100" },
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

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary mb-2">{t.welcomeBack}, {profile?.firstName || 'Afiliado'}</h1>
            <p className="text-muted-foreground">Rastrea tus ganancias y gestiona tus registros de ventas reales.</p>
          </div>
          <Alert className="md:max-w-xs border-primary/20 bg-primary/5">
            <CalendarClock className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs font-bold text-primary uppercase tracking-wider">{t.weeklyPayments}</AlertTitle>
            <AlertDescription className="text-[10px] text-muted-foreground">
              {t.weeklyPaymentsNotice}
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4">
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
              <CardTitle className="text-xl font-headline">Tu Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
              ) : !sales || sales.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Aún no has registrado ninguna venta real.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>{t.amount}</TableHead>
                      <TableHead className="text-right">{t.commission}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.slice(0, 5).map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-xs">{sale.id.substring(0, 8)}</TableCell>
                        <TableCell>{sale.productName || sale.productId}</TableCell>
                        <TableCell>${sale.saleAmount?.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">${sale.commissionEarned?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-[#2870A3] text-white">
            <CardHeader className="flex flex-row items-center gap-2">
              <Landmark className="h-5 w-5" />
              <CardTitle className="text-xl font-headline">{t.payoutInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/10 p-4 rounded-lg border border-white/10">
                <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.bankName}</p>
                <p className="font-semibold text-lg">{profile?.bankId || 'Sin registrar'}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg border border-white/10">
                <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.accountNumber}</p>
                <p className="font-semibold font-mono tracking-widest text-lg">
                  {profile?.bankAccountNumber ? profile.bankAccountNumber : 'Sin registrar'}
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg border border-white/10">
                <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.accountHolder}</p>
                <p className="font-semibold text-lg">{profile?.bankAccountHolderName || 'Sin registrar'}</p>
              </div>
              <div className="pt-2 px-1">
                <p className="text-[10px] italic opacity-80 leading-relaxed">
                  * {t.weeklyPaymentsNotice}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

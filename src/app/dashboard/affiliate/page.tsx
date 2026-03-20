"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BadgeDollarSign, ShoppingBag, TrendingUp, Users, Loader2 } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase'
import { collection, query, where, doc } from 'firebase/firestore'

export default function AffiliateDashboard() {
  const { t } = useLanguage();
  const { user } = useUser();
  const db = useFirestore();

  // Obtener perfil del afiliado
  const affiliateRef = useMemoFirebase(() => user ? doc(db, 'affiliates', user.uid) : null, [db, user]);
  const { data: profile, isLoading: profileLoading } = useDoc(affiliateRef);

  // Obtener ventas del afiliado
  const salesQuery = useMemoFirebase(() => user ? query(collection(db, 'sales'), where('affiliateId', '==', user.uid)) : null, [db, user]);
  const { data: sales, isLoading: salesLoading } = useCollection(salesQuery);

  const stats = [
    { title: t.balance, value: `$${profile?.currentBalance?.toFixed(2) || '0.00'}`, icon: BadgeDollarSign, color: "text-green-600", bg: "bg-green-100" },
    { title: t.totalSales, value: sales?.length.toString() || '0', icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Comisiones Totales", value: `$${sales?.reduce((acc, s) => acc + (s.commissionEarned || 0), 0).toFixed(2) || '0.00'}`, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "Estado Cuenta", value: profile?.status || 'Pendiente', icon: Users, color: "text-violet-600", bg: "bg-violet-100" },
  ]

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">{t.welcomeBack} {profile?.firstName}</h1>
          <p className="text-muted-foreground">Rastrea tus ganancias y gestiona tus registros de ventas reales.</p>
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
                <div className="text-center py-10 text-muted-foreground">Aún no has registrado ninguna venta.</div>
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
                        <TableCell>{sale.productId}</TableCell>
                        <TableCell>${sale.saleAmount?.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">${sale.commissionEarned?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary text-white">
            <CardHeader>
              <CardTitle className="text-xl font-headline">{t.payoutInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.bankName}</p>
                <p className="font-semibold">{profile?.bankId || 'Sin registrar'}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.accountNumber}</p>
                <p className="font-semibold font-mono tracking-widest">{profile?.bankAccountNumber ? `****${profile.bankAccountNumber.slice(-4)}` : 'Sin registrar'}</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.accountHolder}</p>
                <p className="font-semibold">{profile?.bankAccountHolderName || 'Sin registrar'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

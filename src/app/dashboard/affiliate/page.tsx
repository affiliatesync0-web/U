"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BadgeDollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function AffiliateDashboard() {
  const { t } = useLanguage();
  
  const stats = [
    { title: t.balance, value: "$425.50", icon: BadgeDollarSign, color: "text-green-600", bg: "bg-green-100" },
    { title: t.totalSales, value: "24", icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Comisiones Pendientes", value: "$15.00", icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "Clicks de Referidos", value: "1,204", icon: Users, color: "text-violet-600", bg: "bg-violet-100" },
  ]

  const recentSales = [
    { id: "S1024", date: "2024-05-20", product: "Curso Maestro de Excel", buyer: "Carlos M.", amount: "$25.00", commission: "$5.00", status: "Completed" },
    { id: "S1025", date: "2024-05-19", product: "Auditoría SEO Premium", buyer: "Elena R.", amount: "$150.00", commission: "$30.00", status: "Completed" },
    { id: "S1026", date: "2024-05-18", product: "Ebook Marketing Digital", buyer: "Mario S.", amount: "$12.00", commission: "$2.40", status: "Pending" },
  ]

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">{t.welcomeBack}</h1>
          <p className="text-muted-foreground">Rastrea tus ganancias y gestiona tus registros de ventas.</p>
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
              <CardTitle className="text-xl font-headline">{t.recentActivity}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Venta</TableHead>
                    <TableHead>{t.products}</TableHead>
                    <TableHead>{t.buyer}</TableHead>
                    <TableHead>{t.amount}</TableHead>
                    <TableHead className="text-right">{t.commission}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.id}</TableCell>
                      <TableCell>{sale.product}</TableCell>
                      <TableCell>{sale.buyer}</TableCell>
                      <TableCell>{sale.amount}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">{sale.commission}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary text-white">
            <CardHeader>
              <CardTitle className="text-xl font-headline">{t.payoutInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.bankName}</p>
                <p className="font-semibold">BAC Credomatic</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.accountNumber}</p>
                <p className="font-semibold font-mono tracking-widest">**** 5678</p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <p className="text-xs uppercase tracking-wider opacity-70 mb-1">{t.accountHolder}</p>
                <p className="font-semibold">Juan Alberto Perez</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

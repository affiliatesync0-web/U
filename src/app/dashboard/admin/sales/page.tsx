"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Calendar, Filter, Loader2, ShoppingBag } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { collection } from 'firebase/firestore'

export default function AdminSalesPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  const salesQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user) return null;
    return collection(db, 'sales');
  }, [db, user, isUserLoading]);

  const { data: allSales, isLoading } = useCollection(salesQuery);

  return (
    <DashboardShell role="admin">
      <div className="space-y-6 md:space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Auditoría de Transacciones</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2 tracking-tight">{t.globalSales}</h1>
            <p className="text-sm md:text-base text-slate-500 font-medium">Registro completo y transparente de cada venta realizada en la red.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10 text-sm h-12 rounded-xl bg-white border-slate-200" placeholder={t.search} />
            </div>
            <div className="flex gap-2">
               <Button variant="outline" className="h-12 rounded-xl bg-white border-slate-200 font-bold"><Filter className="mr-2 h-4 w-4" /> Filtrar</Button>
               <Button variant="outline" size="icon" className="hidden sm:flex h-12 w-12 rounded-xl bg-white border-slate-200"><Calendar className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {isLoading || isUserLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
          </div>
        ) : !allSales || allSales.length === 0 ? (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center p-24 text-center bg-slate-50/50 rounded-[2rem]">
            <ShoppingBag className="h-16 w-16 text-slate-200 mb-6" />
            <h3 className="text-xl font-bold text-slate-400 mb-2">Sin ventas registradas</h3>
            <p className="text-slate-400 max-w-xs text-sm">No se han registrado transacciones reales todavía en la base de datos.</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:hidden">
              {allSales.map((sale) => (
                <Card key={sale.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white border border-slate-50">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground bg-slate-100 px-2 py-1 rounded-md">ID: {sale.id.substring(0, 8)}</span>
                        <h3 className="font-bold text-base mt-2 text-slate-800">{sale.productName || sale.productId}</h3>
                      </div>
                      <Badge variant={sale.status === 'Completed' ? 'default' : 'secondary'} className="rounded-lg font-bold text-[10px] px-3">
                        {sale.status === 'Completed' ? t.completed : t.pending}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs py-2">
                      <div>
                        <p className="text-muted-foreground uppercase text-[9px] font-bold tracking-widest mb-1">{t.buyer}</p>
                        <p className="font-bold text-slate-700 truncate">{sale.buyerName || sale.buyerId}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-[9px] font-bold tracking-widest mb-1">{t.affiliate}</p>
                        <p className="text-primary font-bold truncate">#{sale.affiliateId.substring(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                      <div className="text-xl font-bold text-slate-900">${sale.saleAmount?.toFixed(2)}</div>
                      <div className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg">Comisión: ${sale.commissionEarned?.toFixed(2)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="hidden md:block border-none shadow-sm overflow-hidden rounded-[2rem] bg-white border border-slate-50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="px-8 h-14 uppercase text-[10px] font-bold tracking-widest">ID Venta</TableHead>
                        <TableHead className="h-14 uppercase text-[10px] font-bold tracking-widest">{t.date}</TableHead>
                        <TableHead className="h-14 uppercase text-[10px] font-bold tracking-widest">Producto</TableHead>
                        <TableHead className="h-14 uppercase text-[10px] font-bold tracking-widest">{t.buyer}</TableHead>
                        <TableHead className="h-14 uppercase text-[10px] font-bold tracking-widest">{t.affiliate}</TableHead>
                        <TableHead className="h-14 uppercase text-[10px] font-bold tracking-widest">{t.amount}</TableHead>
                        <TableHead className="px-8 text-right h-14 uppercase text-[10px] font-bold tracking-widest">{t.commission}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allSales.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-slate-50/50 transition-colors h-16">
                          <TableCell className="px-8 font-mono font-bold text-xs text-muted-foreground">#{sale.id.substring(0, 8)}</TableCell>
                          <TableCell className="text-slate-500 text-xs font-medium">{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="font-bold text-slate-800">{sale.productName || sale.productId}</TableCell>
                          <TableCell>
                            <div className="text-sm font-bold text-slate-700">{sale.buyerName || sale.buyerId}</div>
                            <div className="text-[10px] text-muted-foreground font-medium">{sale.buyerId}</div>
                          </TableCell>
                          <TableCell>
                             <Badge variant="outline" className="text-accent border-accent/30 font-bold bg-accent/5 rounded-lg px-2">#{sale.affiliateId.substring(0, 8)}</Badge>
                          </TableCell>
                          <TableCell className="font-bold text-slate-900">${sale.saleAmount?.toFixed(2)}</TableCell>
                          <TableCell className="px-8 text-right font-bold text-green-600 tracking-tight">
                            <span className="bg-green-50 px-3 py-1 rounded-lg">${sale.commissionEarned?.toFixed(2)}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
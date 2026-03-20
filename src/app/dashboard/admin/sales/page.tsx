"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Calendar, Filter, Loader2 } from 'lucide-react'
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
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary mb-2">{t.globalSales}</h1>
            <p className="text-sm md:text-base text-muted-foreground">Registro completo de cada transacción realizada por afiliados.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10 text-sm h-10" placeholder={t.search} />
            </div>
            <div className="flex gap-2">
               <Button variant="outline" className="flex-1 sm:flex-none"><Filter className="mr-2 h-4 w-4" /> Filtrar</Button>
               <Button variant="outline" size="icon" className="hidden sm:flex"><Calendar className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {isLoading || isUserLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !allSales || allSales.length === 0 ? (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center p-12 text-center">
            <p className="text-muted-foreground mb-4">No se han registrado ventas todavía.</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {allSales.map((sale) => (
                <Card key={sale.id} className="border-none shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded">{sale.id.substring(0, 8)}</span>
                        <h3 className="font-bold text-sm mt-1">{sale.productId}</h3>
                      </div>
                      <Badge variant={sale.status === 'Completed' ? 'default' : 'secondary'} className="text-[10px]">
                        {sale.status === 'Completed' ? t.completed : t.pending}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground uppercase text-[9px] font-bold">{t.buyer}</p>
                        <p className="font-medium">{sale.buyerId}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-[9px] font-bold">{t.affiliate}</p>
                        <p className="text-primary font-medium">{sale.affiliateId}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-lg font-bold">${sale.saleAmount?.toFixed(2)}</div>
                      <div className="text-sm font-bold text-green-600">Comisión: ${sale.commissionEarned?.toFixed(2)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="hidden md:block border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>ID Venta</TableHead>
                        <TableHead>{t.date}</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>{t.buyer}</TableHead>
                        <TableHead>{t.affiliate}</TableHead>
                        <TableHead>{t.amount}</TableHead>
                        <TableHead className="text-right">{t.commission}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-mono font-bold text-xs">{sale.id.substring(0, 8)}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell className="font-semibold">{sale.productId}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{sale.buyerId}</div>
                          </TableCell>
                          <TableCell>
                             <Badge variant="outline" className="text-[#A37EDC] border-[#A37EDC]">{sale.affiliateId}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">${sale.saleAmount?.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold text-green-600">${sale.commissionEarned?.toFixed(2)}</TableCell>
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

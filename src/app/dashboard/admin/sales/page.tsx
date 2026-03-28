
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Calendar, Filter, Loader2, ShoppingBag, Landmark, CreditCard, Info, Eye } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
                        <PaymentMethodBadge method={sale.paymentMethod} t={t} />
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
                        <p className="text-primary font-bold truncate">#{sale.affiliateId?.substring(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                      <div className="text-xl font-bold text-slate-900">${sale.saleAmount?.toFixed(2)}</div>
                      <SaleDetailsDialog sale={sale} t={t} />
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
                        <TableHead className="px-8 h-14 uppercase text-[10px] font-bold tracking-widest">Venta / Pago</TableHead>
                        <TableHead className="h-14 uppercase text-[10px] font-bold tracking-widest">{t.date}</TableHead>
                        <TableHead className="h-14 uppercase text-[10px] font-bold tracking-widest">Producto</TableHead>
                        <TableHead className="h-14 uppercase text-[10px] font-bold tracking-widest">{t.buyer}</TableHead>
                        <TableHead className="h-14 uppercase text-[10px] font-bold tracking-widest">{t.amount}</TableHead>
                        <TableHead className="px-8 text-right h-14 uppercase text-[10px] font-bold tracking-widest">{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allSales.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-slate-50/50 transition-colors h-16">
                          <TableCell className="px-8">
                            <div className="flex flex-col gap-1">
                              <span className="font-mono font-bold text-[10px] text-muted-foreground">#{sale.id.substring(0, 8)}</span>
                              <PaymentMethodBadge method={sale.paymentMethod} t={t} />
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500 text-xs font-medium">{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A'}</TableCell>
                          <TableCell>
                            <div className="font-bold text-slate-800">{sale.productName || sale.productId}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-bold text-slate-700">{sale.buyerName || sale.buyerId}</div>
                            <div className="text-[10px] text-muted-foreground font-medium">{sale.buyerId}</div>
                          </TableCell>
                          <TableCell className="font-bold text-slate-900">${sale.saleAmount?.toFixed(2)}</TableCell>
                          <TableCell className="px-8 text-right">
                            <SaleDetailsDialog sale={sale} t={t} />
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

function PaymentMethodBadge({ method, t }: { method: string, t: any }) {
  if (method === 'card') {
    return <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50 text-[9px] font-black uppercase tracking-widest"><CreditCard className="h-3 w-3 mr-1" /> {t.creditCard}</Badge>
  }
  if (method === 'transfer') {
    return <Badge variant="outline" className="text-purple-600 border-purple-100 bg-purple-50 text-[9px] font-black uppercase tracking-widest"><Landmark className="h-3 w-3 mr-1" /> {t.bankTransfer}</Badge>
  }
  return <Badge variant="outline" className="text-slate-400 border-slate-100 text-[9px] font-black uppercase tracking-widest">Manual</Badge>
}

function SaleDetailsDialog({ sale, t }: { sale: any, t: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-widest text-primary gap-2">
          <Eye className="h-4 w-4" /> Detalle Pago
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-slate-900 p-10 text-white">
           <div className="flex items-center justify-between mb-6">
             <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
               <ShoppingBag className="h-6 w-6" />
             </div>
             <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] tracking-widest">TRANSACCIÓN FINALIZADA</Badge>
           </div>
           <DialogHeader>
             <DialogTitle className="text-2xl font-headline font-black tracking-tight">Detalles de Venta</DialogTitle>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Operación ID: {sale.id}</p>
           </DialogHeader>
        </div>
        <div className="p-10 space-y-8 bg-white">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Información del Comprador</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nombre</p>
                <p className="text-sm font-black text-slate-800">{sale.buyerName}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                <p className="text-sm font-bold text-slate-600">{sale.buyerId}</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              {sale.paymentMethod === 'card' ? <CreditCard className="h-5 w-5 text-blue-500" /> : <Landmark className="h-5 w-5 text-purple-500" />}
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{t.paymentMethod}: {sale.paymentMethod === 'card' ? t.creditCard : t.bankTransfer}</h4>
            </div>
            
            {sale.paymentMethod === 'card' && sale.cardInfo && (
              <div className="space-y-3">
                <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.cardNumber}</p>
                  <p className="text-lg font-black font-mono tracking-widest text-slate-800">{sale.cardInfo.number}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.expiryDate}</p>
                    <p className="text-sm font-black text-slate-800">{sale.cardInfo.expiry}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.cvv}</p>
                    <p className="text-sm font-black text-slate-800">***</p>
                  </div>
                </div>
              </div>
            )}

            {sale.paymentMethod === 'transfer' && (
              <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.voucherReference}</p>
                <p className="text-xl font-black font-mono text-purple-600 tracking-tight">{sale.voucherReference || 'N/A'}</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t flex justify-between items-center">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Monto de la Venta</p>
              <p className="text-2xl font-black text-slate-900">${sale.saleAmount?.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Comisión Generada</p>
              <p className="text-2xl font-black text-green-600">${sale.commissionEarned?.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

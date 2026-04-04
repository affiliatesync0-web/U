
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Calendar, Filter, Loader2, ShoppingBag, Landmark, Info, Eye, CheckCircle2, Phone, Mail, User, ShieldCheck } from 'lucide-react'
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
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'

export default function AdminSalesPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  const salesQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user) return null;
    return collection(db, 'sales');
  }, [db, user, isUserLoading]);

  const { data: allSales, isLoading } = useCollection(salesQuery);

  const handleApproveSale = (saleId: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'sales', saleId), {
      status: 'Completed',
      approvedAt: new Date().toISOString()
    });
    toast({ title: "Pago Validado", description: "El acceso al curso ha sido habilitado para el comprador." });
  };

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
            <p className="text-sm md:text-base text-slate-500 font-medium">Valida los depósitos bancarios para activar el acceso a los cursos.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10 text-sm h-12 rounded-xl bg-white border-slate-200" placeholder={t.search} />
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
            <p className="text-slate-400 max-w-xs text-sm">No se han registrado transacciones bancarias todavía.</p>
          </Card>
        ) : (
          <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-white ring-1 ring-slate-100">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="px-8 h-16 uppercase text-[10px] font-black tracking-widest text-slate-400">Voucher / Pago</TableHead>
                      <TableHead className="h-16 uppercase text-[10px] font-black tracking-widest text-slate-400">Fecha</TableHead>
                      <TableHead className="h-16 uppercase text-[10px] font-black tracking-widest text-slate-400">Producto Comprado</TableHead>
                      <TableHead className="h-16 uppercase text-[10px] font-black tracking-widest text-slate-400">Comprador</TableHead>
                      <TableHead className="h-16 uppercase text-[10px] font-black tracking-widest text-slate-400">Estado</TableHead>
                      <TableHead className="px-8 text-right h-16 uppercase text-[10px] font-black tracking-widest text-slate-400">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSales.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-slate-50 transition-colors h-20">
                        <TableCell className="px-8">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono font-black text-sm text-primary tracking-tighter">{sale.voucherReference || 'SIN REF'}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t.bankTransfer}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 text-[11px] font-bold">{sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>
                          <div className="font-black text-slate-800 text-xs uppercase">{sale.productName || 'Curso'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-[11px] font-black text-slate-700 uppercase">{sale.buyerName}</div>
                          <div className="text-[9px] text-slate-400 font-bold">{sale.buyerId}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={sale.status === 'Completed' ? 'default' : 'secondary'} 
                            className={cn(
                              "rounded-full font-black text-[9px] px-3 py-1 uppercase tracking-widest border-none shadow-sm",
                              sale.status === 'Completed' ? "bg-green-500" : "bg-amber-500 text-white"
                            )}
                          >
                            {sale.status === 'Completed' ? 'VÁLIDO ✓' : 'PENDIENTE'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <div className="flex justify-end gap-2">
                            {sale.status !== 'Completed' && (
                              <Button 
                                size="sm" 
                                className="h-9 bg-green-600 hover:bg-green-700 text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-green-100"
                                onClick={() => handleApproveSale(sale.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> HABILITAR ACCESO
                              </Button>
                            )}
                            <SaleDetailsDialog sale={sale} t={t} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}

function SaleDetailsDialog({ sale, t }: { sale: any, t: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 font-black text-[9px] uppercase tracking-widest gap-2">
          <Eye className="h-3.5 w-3.5" /> VER VOUCHER
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-slate-900 p-10 text-white">
           <div className="flex items-center justify-between mb-6">
             <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
               <Landmark className="h-6 w-6" />
             </div>
             <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] tracking-widest uppercase">Auditoría de Pago</Badge>
           </div>
           <DialogHeader>
             <DialogTitle className="text-2xl font-headline font-black tracking-tight">Comprobante Recibido</DialogTitle>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">ID Transacción: {sale.id.substring(0, 8)}</p>
           </DialogHeader>
        </div>
        <div className="p-10 space-y-8 bg-white">
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border">
               <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                 <User className="h-5 w-5 text-slate-400" />
               </div>
               <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comprador</p>
                 <p className="text-xs font-black text-slate-800 uppercase">{sale.buyerName}</p>
               </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-purple-50 border border-purple-100 text-center space-y-3">
              <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Número de Voucher</p>
              <p className="text-4xl font-black font-mono tracking-widest text-purple-600">{sale.voucherReference || 'N/A'}</p>
            </div>
          </div>

          <div className="pt-6 border-t flex justify-between items-center">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Monto Pagado</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">${sale.saleAmount?.toFixed(2)}</p>
            </div>
            {sale.buyerPhone && (
              <Button asChild variant="outline" className="h-12 px-6 rounded-xl border-green-100 text-green-600 font-black text-[10px] uppercase">
                <a href={`https://wa.me/${sale.buyerPhone.replace(/\D/g, '')}`} target="_blank">HABLAR POR WHATSAPP</a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

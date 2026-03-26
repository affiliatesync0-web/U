
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Mail, Loader2, User, Calendar, Trash2, ShoppingBag, UserCheck, ShieldCheck } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'

export default function AdminBuyersPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const buyersQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user) return null;
    return collection(db, 'buyers');
  }, [db, user, isUserLoading]);

  const { data: buyers, isLoading } = useCollection(buyersQuery);

  const handleDeleteBuyer = (buyerId: string) => {
    const buyerRef = doc(db, 'buyers', buyerId);
    deleteDocumentNonBlocking(buyerRef);
    
    toast({
      title: "Comprador eliminado",
      description: "El registro del cliente ha sido borrado permanentemente.",
    });
  };

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 shadow-inner">
                <UserCheck className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-green-600 uppercase tracking-[0.3em]">Gestión de Base de Datos</span>
            </div>
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight">Directorio de Compradores</h1>
            <p className="text-slate-500 font-medium">Control centralizado de clientes finales registrados en la red Sync.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <Input className="pl-14 h-16 rounded-[1.5rem] border-none bg-white shadow-xl text-sm font-bold" placeholder="Buscar por nombre o email..." />
          </div>
        </div>

        {isLoading || isUserLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          </div>
        ) : !buyers || buyers.length === 0 ? (
          <Card className="border-dashed border-4 flex flex-col items-center justify-center p-32 text-center bg-white/50 rounded-[4rem] border-slate-100">
            <ShoppingBag className="h-20 w-20 text-slate-200 mb-8 rotate-12" />
            <h3 className="text-2xl font-black text-slate-400 mb-2">Sin clientes registrados</h3>
            <p className="text-slate-400 max-w-sm font-bold text-sm leading-relaxed">Tu base de datos de compradores está esperando las primeras conversiones.</p>
          </Card>
        ) : (
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                      <TableHead className="px-10 h-20 uppercase text-[10px] font-black text-slate-400 tracking-widest">{t.firstName} {t.lastName}</TableHead>
                      <TableHead className="h-20 uppercase text-[10px] font-black text-slate-400 tracking-widest">{t.email}</TableHead>
                      <TableHead className="h-20 uppercase text-[10px] font-black text-slate-400 tracking-widest">{t.date}</TableHead>
                      <TableHead className="h-20 uppercase text-[10px] font-black text-slate-400 tracking-widest">Estatus</TableHead>
                      <TableHead className="px-10 text-right h-20 uppercase text-[10px] font-black text-slate-400 tracking-widest">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyers.map((buyer) => (
                      <TableRow key={buyer.id} className="hover:bg-slate-50/30 transition-all h-24 border-b border-slate-50 last:border-0">
                        <TableCell className="px-10">
                          <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm shadow-inner group-hover:rotate-3 transition-transform">
                              {buyer.firstName?.charAt(0)}
                            </div>
                            <span className="font-black text-slate-800 text-lg tracking-tight">{buyer.firstName} {buyer.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-sm font-bold text-slate-500">
                            <Mail className="h-4 w-4 text-primary/40" /> {buyer.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                            <Calendar className="h-4 w-4" /> {buyer.registeredAt ? new Date(buyer.registeredAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-lg w-fit border border-green-100">
                             <ShieldCheck className="h-3 w-3" /> VERIFICADO
                           </div>
                        </TableCell>
                        <TableCell className="px-10 text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-12 w-12 text-destructive hover:bg-destructive/10 rounded-2xl transition-colors">
                                <Trash2 className="h-6 w-6" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-3xl font-headline font-black text-slate-900 tracking-tight">{t.confirmDeleteTitle}</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 font-bold leading-relaxed mt-4">
                                  Esta acción eliminará permanentemente al comprador del sistema. El historial de compras asociado podría quedar huérfano.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="mt-10 gap-4">
                                <AlertDialogCancel className="h-14 rounded-2xl font-black text-slate-400 border-slate-100">CANCELAR</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteBuyer(buyer.id)} className="h-14 rounded-2xl bg-destructive text-white font-black shadow-xl shadow-destructive/20">
                                  ELIMINAR DEFINITIVAMENTE
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

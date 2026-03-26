
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Mail, Loader2, User, Calendar, Trash2, ShoppingBag } from 'lucide-react'
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
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Gestión de Clientes</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary mb-2">Directorio de Compradores</h1>
            <p className="text-sm md:text-base text-muted-foreground">Administra la base de datos global de clientes finales.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 h-10" placeholder={t.search} />
          </div>
        </div>

        {isLoading || isUserLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !buyers || buyers.length === 0 ? (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center p-24 text-center bg-slate-50/50 rounded-[2rem]">
            <User className="h-12 w-12 text-slate-200 mb-4" />
            <p className="text-muted-foreground">No hay compradores registrados todavía.</p>
          </Card>
        ) : (
          <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="px-8 h-14 uppercase text-[10px] font-bold tracking-widest">{t.firstName} {t.lastName}</TableHead>
                      <TableHead className="h-14 uppercase text-[10px] font-bold tracking-widest">{t.email}</TableHead>
                      <TableHead className="h-14 uppercase text-[10px] font-bold tracking-widest">{t.date}</TableHead>
                      <TableHead className="px-8 text-right h-14 uppercase text-[10px] font-bold tracking-widest">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyers.map((buyer) => (
                      <TableRow key={buyer.id} className="hover:bg-slate-50/50 transition-colors h-16">
                        <TableCell className="px-8">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                              {buyer.firstName?.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-700">{buyer.firstName} {buyer.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Mail className="h-3 w-3" /> {buyer.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Calendar className="h-3 w-3" /> {buyer.registeredAt ? new Date(buyer.registeredAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t.confirmDeleteTitle}</AlertDialogTitle>
                                <AlertDialogDescription>Esta acción eliminará permanentemente al comprador del sistema.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteBuyer(buyer.id)} className="bg-destructive text-destructive-foreground">
                                  {t.delete}
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

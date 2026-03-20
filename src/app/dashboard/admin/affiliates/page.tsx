
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Mail, ShieldCheck, Loader2, User, Landmark, Calendar, DollarSign, Lock, Unlock, Trash2, Banknote } from 'lucide-react'
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'

export default function AdminAffiliatesPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const affiliatesQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user) return null;
    return collection(db, 'affiliates');
  }, [db, user, isUserLoading]);

  const { data: affiliates, isLoading } = useCollection(affiliatesQuery);

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'Active': return t.active;
      case 'Pending': return t.pending;
      case 'Blocked': return t.blockedStatus;
      default: return status || 'Inactivo';
    }
  }

  const handleToggleBlock = (affId: string, currentStatus: string) => {
    const affRef = doc(db, 'affiliates', affId);
    const newStatus = currentStatus === 'Blocked' ? 'Active' : 'Blocked';
    
    updateDocumentNonBlocking(affRef, { status: newStatus });
    
    toast({
      title: newStatus === 'Blocked' ? "Afiliado bloqueado" : "Afiliado desbloqueado",
      description: `La cuenta ha sido ${newStatus === 'Blocked' ? 'suspendida' : 'activada'} correctamente.`,
    });
  };

  const handleMarkAsPaid = (affId: string) => {
    const affRef = doc(db, 'affiliates', affId);
    updateDocumentNonBlocking(affRef, { currentBalance: 0 });
    
    toast({
      title: t.paymentSuccess,
      description: t.paymentSuccessDesc,
    });
  };

  const handleDeleteAffiliate = (affId: string) => {
    const affRef = doc(db, 'affiliates', affId);
    deleteDocumentNonBlocking(affRef);
    
    toast({
      title: "Afiliado eliminado",
      description: "Los datos han sido borrados permanentemente.",
    });
  };

  return (
    <DashboardShell role="admin">
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary mb-2">{t.affiliateDirectory}</h1>
            <p className="text-sm md:text-base text-muted-foreground">{t.manageNetwork}</p>
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
        ) : !affiliates || affiliates.length === 0 ? (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center p-12 text-center">
            <p className="text-muted-foreground mb-4">No hay afiliados registrados todavía.</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {affiliates.map((aff) => (
                <Card key={aff.id} className="border-none shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {aff.firstName?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">{aff.firstName} {aff.lastName}</h3>
                          <p className="text-[10px] text-muted-foreground font-mono">{aff.id}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={aff.status === 'Active' ? 'default' : (aff.status === 'Blocked' ? 'destructive' : 'secondary')} 
                        className={aff.status === 'Active' ? 'bg-green-500' : ''}
                      >
                        {getStatusLabel(aff.status || 'Pending')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                      <div>
                        <p className="text-muted-foreground uppercase text-[9px] font-bold mb-1">{t.bankName}</p>
                        <p className="font-medium truncate">{aff.bankId || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-[9px] font-bold mb-1">{t.balance}</p>
                        <p className="font-bold text-primary">${aff.currentBalance?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 flex-wrap">
                      <AffiliateDetailsDialog affiliate={aff} t={t} />
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50"
                            disabled={aff.currentBalance === 0}
                          >
                            <Banknote className="mr-1 h-3 w-3" /> {t.markAsPaid}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.confirmPaidTitle}</AlertDialogTitle>
                            <AlertDialogDescription>{t.confirmPaidDesc}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleMarkAsPaid(aff.id)} className="bg-green-600 hover:bg-green-700">
                              {t.markAsPaid}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`h-8 px-2 ${aff.status === 'Blocked' ? 'text-green-600 border-green-200' : 'text-amber-600 border-amber-200'}`}
                        onClick={() => handleToggleBlock(aff.id, aff.status)}
                      >
                        {aff.status === 'Blocked' ? <Unlock className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
                        {aff.status === 'Blocked' ? t.unblock : t.block}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.confirmDeleteTitle}</AlertDialogTitle>
                            <AlertDialogDescription>{t.confirmDeleteDesc}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAffiliate(aff.id)} className="bg-destructive text-destructive-foreground">
                              {t.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>{t.firstName}</TableHead>
                        <TableHead>{t.contact}</TableHead>
                        <TableHead>{t.balance}</TableHead>
                        <TableHead>{t.status}</TableHead>
                        <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliates.map((aff) => (
                        <TableRow key={aff.id}>
                          <TableCell className="font-mono text-xs font-bold text-muted-foreground">{aff.id.substring(0, 8)}</TableCell>
                          <TableCell>
                            <div className="font-semibold">{aff.firstName} {aff.lastName}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Registrado: {aff.registeredAt ? new Date(aff.registeredAt).toLocaleDateString() : 'N/A'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" /> {aff.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-primary">${aff.currentBalance?.toFixed(2) || '0.00'}</div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={aff.status === 'Active' ? 'default' : (aff.status === 'Blocked' ? 'destructive' : 'secondary')} 
                              className={aff.status === 'Active' ? 'bg-green-500' : ''}
                            >
                              {getStatusLabel(aff.status || 'Pending')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex justify-end gap-2">
                               <AffiliateDetailsDialog affiliate={aff} t={t} />
                               
                               <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      disabled={aff.currentBalance === 0}
                                      title={t.markAsPaid}
                                    >
                                      <Banknote className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t.confirmPaidTitle}</AlertDialogTitle>
                                      <AlertDialogDescription>{t.confirmPaidDesc}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleMarkAsPaid(aff.id)} className="bg-green-600 hover:bg-green-700">
                                        {t.markAsPaid}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>

                               <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className={`h-8 w-8 ${aff.status === 'Blocked' ? 'text-green-600' : 'text-amber-600'}`}
                                  onClick={() => handleToggleBlock(aff.id, aff.status)}
                                  title={aff.status === 'Blocked' ? t.unblock : t.block}
                               >
                                  {aff.status === 'Blocked' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                               </Button>

                               <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title={t.delete}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t.confirmDeleteTitle}</AlertDialogTitle>
                                      <AlertDialogDescription>{t.confirmDeleteDesc}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteAffiliate(aff.id)} className="bg-destructive text-destructive-foreground">
                                        {t.delete}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                             </div>
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

function AffiliateDetailsDialog({ affiliate, t }: any) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-accent hover:text-accent/80 hover:bg-accent/10">
          <ShieldCheck className="mr-2 h-4 w-4" /> {t.review}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              {affiliate.firstName?.charAt(0)}
            </div>
            <div>
              <DialogTitle className="text-xl font-headline font-bold text-primary">
                {affiliate.firstName} {affiliate.lastName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-mono">{affiliate.id}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
             <div className="p-4 rounded-xl bg-muted/30 border">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">{t.personalInfo}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{t.firstName}</span>
                    <span className="text-sm font-semibold">{affiliate.firstName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{t.lastName}</span>
                    <span className="text-sm font-semibold">{affiliate.lastName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{t.email}</span>
                    <span className="text-sm font-semibold">{affiliate.email}</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {t.date}</span>
                    <span className="text-xs font-mono">{affiliate.registeredAt ? new Date(affiliate.registeredAt).toLocaleString() : 'N/A'}</span>
                  </div>
                </div>
             </div>

             <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                  <DollarSign className="h-3 w-3" /> {t.balance}
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-primary font-medium">{t.amount} Acumulado</span>
                  <span className="text-2xl font-bold text-primary">${affiliate.currentBalance?.toFixed(2) || '0.00'}</span>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                <h3 className="text-xs font-bold text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Landmark className="h-3 w-3" /> {t.bankDetails}
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{t.bankName}</p>
                    <p className="text-sm font-semibold text-accent">{affiliate.bankId || 'Sin registrar'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{t.accountNumber}</p>
                    <p className="text-sm font-mono font-bold tracking-wider">{affiliate.bankAccountNumber || 'Sin registrar'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">{t.accountHolder}</p>
                    <p className="text-sm font-semibold">{affiliate.bankAccountHolderName || 'Sin registrar'}</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

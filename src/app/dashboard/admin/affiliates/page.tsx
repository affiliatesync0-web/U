
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Mail, ShieldCheck, Loader2, User, Landmark, Calendar, DollarSign, Lock, Unlock, Trash2, Banknote, ClipboardCheck, CheckCircle2, XCircle } from 'lucide-react'
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

  const handleApprove = (affId: string) => {
    const affRef = doc(db, 'affiliates', affId);
    updateDocumentNonBlocking(affRef, { status: 'Active' });
    toast({ title: "Afiliado Aprobado", description: "El afiliado ya tiene acceso completo a la red." });
  };

  const handleReject = (affId: string) => {
    const affRef = doc(db, 'affiliates', affId);
    updateDocumentNonBlocking(affRef, { status: 'Blocked' });
    toast({ variant: "destructive", title: "Solicitud Rechazada", description: "Se ha denegado el acceso al postulante." });
  };

  const handleToggleBlock = (affId: string, currentStatus: string) => {
    const affRef = doc(db, 'affiliates', affId);
    const newStatus = currentStatus === 'Blocked' ? 'Active' : 'Blocked';
    updateDocumentNonBlocking(affRef, { status: newStatus });
    toast({
      title: newStatus === 'Blocked' ? "Afiliado bloqueado" : "Afiliado desbloqueado",
      description: `La cuenta ha sido ${newStatus === 'Blocked' ? 'suspensa' : 'activada'} correctamente.`,
    });
  };

  const handleMarkAsPaid = (affId: string) => {
    const affRef = doc(db, 'affiliates', affId);
    updateDocumentNonBlocking(affRef, { currentBalance: 0 });
    toast({ title: t.paymentSuccess, description: t.paymentSuccessDesc });
  };

  const handleDeleteAffiliate = (affId: string) => {
    const affRef = doc(db, 'affiliates', affId);
    deleteDocumentNonBlocking(affRef);
    toast({ title: "Afiliado eliminado", description: "Los datos han sido borrados permanentemente." });
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
          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Afiliado</TableHead>
                      <TableHead>Estatus</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead className="text-right">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.map((aff) => (
                      <TableRow key={aff.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{aff.firstName} {aff.lastName}</span>
                            <span className="text-xs text-muted-foreground">{aff.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={aff.status === 'Active' ? 'default' : (aff.status === 'Blocked' ? 'destructive' : 'secondary')} 
                            className={aff.status === 'Active' ? 'bg-green-500' : (aff.status === 'Pending' ? 'bg-amber-500 text-white' : '')}
                          >
                            {getStatusLabel(aff.status || 'Pending')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-primary">${aff.currentBalance?.toFixed(2) || '0.00'}</div>
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                             {/* Botón de Evaluación (Examen) */}
                             <AffiliateExamDialog affiliate={aff} t={t} onApprove={() => handleApprove(aff.id)} onReject={() => handleReject(aff.id)} />
                             
                             {aff.status === 'Pending' ? (
                               <>
                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleApprove(aff.id)} title="Aprobar">
                                   <CheckCircle2 className="h-4 w-4" />
                                 </Button>
                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleReject(aff.id)} title="Rechazar">
                                   <XCircle className="h-4 w-4" />
                                 </Button>
                               </>
                             ) : (
                               <>
                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" disabled={aff.currentBalance === 0} onClick={() => handleMarkAsPaid(aff.id)} title="Pagar">
                                   <Banknote className="h-4 w-4" />
                                 </Button>
                                 <Button size="icon" variant="ghost" className={`h-8 w-8 ${aff.status === 'Blocked' ? 'text-green-600' : 'text-amber-600'}`} onClick={() => handleToggleBlock(aff.id, aff.status)}>
                                   {aff.status === 'Blocked' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                 </Button>
                               </>
                             )}
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
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
                                    <AlertDialogAction onClick={() => handleDeleteAffiliate(aff.id)} className="bg-destructive text-white">ELIMINAR</AlertDialogAction>
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
        )}
      </div>
    </DashboardShell>
  )
}

function AffiliateExamDialog({ affiliate, t, onApprove, onReject }: any) {
  const answers = affiliate.examAnswers;
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2 text-primary border-primary/20">
          <ClipboardCheck className="mr-2 h-4 w-4" /> {t.review} Examen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-headline font-black text-primary">Revisión de Evaluación</DialogTitle>
          <p className="text-sm text-muted-foreground">{affiliate.firstName} {affiliate.lastName} - {affiliate.email}</p>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          {!answers ? (
            <p className="text-center py-10 text-muted-foreground">Este afiliado no completó el examen técnico.</p>
          ) : (
            <>
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t.question1}</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{answers.q1}"</p>
              </div>
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t.question2}</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{answers.q2}"</p>
              </div>
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t.question3}</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{answers.q3}"</p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-4 border-t pt-6">
          <Button className="flex-1 bg-green-600 hover:bg-green-700 font-bold" onClick={onApprove}>APROBAR AFILIADO</Button>
          <Button variant="destructive" className="flex-1 font-bold" onClick={onReject}>RECHAZAR SOLICITUD</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

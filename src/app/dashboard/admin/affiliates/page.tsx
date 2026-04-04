"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Mail, ShieldCheck, Loader2, User, Landmark, Calendar, DollarSign, Lock, Unlock, Trash2, Banknote, ClipboardCheck, CheckCircle2, XCircle, Phone, Smartphone, Info } from 'lucide-react'
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
import { sendEmail } from '@/lib/email'

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

  const handleApprove = async (affId: string, affEmail: string, affName: string) => {
    const affRef = doc(db, 'affiliates', affId);
    updateDocumentNonBlocking(affRef, { status: 'Active' });
    
    try {
      await sendEmail({
        to: affEmail,
        subject: `✅ ¡Cuenta Activada! - Sync Connect`,
        text: `¡Felicidades ${affName}! Tu solicitud de afiliado ha sido revisada y aprobada por nuestro equipo.\n\nYa puedes acceder a tu panel administrativo para obtener tus links de divulgación y empezar a generar comisiones reales.\n\nInicia sesión aquí: ${window.location.origin}/auth/login\n\n¡Bienvenido a la red de marketing más potente de Nicaragua!`
      });
      toast({ title: "Afiliado Aprobado", description: `Se ha enviado el correo de activación a ${affEmail}.` });
    } catch (error) {
      toast({ title: "Afiliado Aprobado", description: "La cuenta está activa, pero hubo un error enviando el email de aviso." });
    }
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
    if (!db) return;
    const affRef = doc(db, 'affiliates', affId);
    deleteDocumentNonBlocking(affRef);
    toast({ 
      title: "Solicitud de borrado", 
      description: "Se ha procesado la eliminación del afiliado.",
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
                             <AffiliateDetailsDialog 
                                affiliate={aff} 
                                t={t} 
                                onApprove={() => handleApprove(aff.id, aff.email, aff.firstName)} 
                                onReject={() => handleReject(aff.id)} 
                             />
                             
                             {aff.status === 'Pending' ? (
                               <>
                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleApprove(aff.id, aff.email, aff.firstName)} title="Aprobar">
                                   <CheckCircle2 className="h-4 w-4" />
                                 </Button>
                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => handleReject(aff.id)} title="Rechazar">
                                   <XCircle className="h-4 w-4" />
                                 </Button>
                               </>
                             ) : (
                               <>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" disabled={aff.currentBalance === 0} title="Marcar como Pagado">
                                        <Banknote className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Confirmar Pago a {aff.firstName}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Esto reseteará el saldo acumulado de <strong>${aff.currentBalance?.toFixed(2)}</strong> a cero. Realiza esta acción solo después de haber transferido el dinero a su cuenta bancaria.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <div className="bg-slate-50 p-4 rounded-xl space-y-2 border">
                                         <p className="text-[10px] font-black uppercase text-slate-400">Datos del Afiliado:</p>
                                         <p className="text-xs font-bold">Banco: {aff.bankId || 'No definido'}</p>
                                         <p className="text-xs font-bold">Cuenta: {aff.bankAccountNumber || 'No definida'}</p>
                                         <p className="text-xs font-bold">Titular: {aff.bankAccountHolderName || 'No definido'}</p>
                                      </div>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleMarkAsPaid(aff.id)} className="bg-green-600">CONFIRMAR PAGO</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                 </AlertDialog>
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
                                    <AlertDialogAction onClick={() => handleDeleteAffiliate(aff.id)} className="bg-destructive text-white hover:bg-destructive/90">ELIMINAR DEFINITIVAMENTE</AlertDialogAction>
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

function AffiliateDetailsDialog({ affiliate, t, onApprove, onReject }: any) {
  const answers = affiliate.examAnswers;
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2 text-primary border-primary/20">
          <Info className="mr-2 h-4 w-4" /> Ver Detalles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 border-none shadow-2xl">
        <div className="bg-slate-900 p-8 text-white">
           <DialogHeader>
             <DialogTitle className="text-2xl font-headline font-black text-primary">Perfil del Afiliado</DialogTitle>
             <p className="text-slate-400 font-bold">{affiliate.firstName} {affiliate.lastName}</p>
           </DialogHeader>
        </div>
        
        <div className="p-8 space-y-8 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Contacto</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600"><Mail className="h-4 w-4 opacity-40" /> {affiliate.email}</div>
                <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                  <Smartphone className="h-4 w-4" /> 
                  <a href={`https://wa.me/${affiliate.whatsappNumber?.replace(/\D/g, '')}`} target="_blank" className="hover:underline">
                    +{affiliate.whatsappNumber || 'Sin número'}
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest border-b border-primary/10 pb-2">Datos Bancarios para Pago</h4>
              <div className="bg-primary/5 p-4 rounded-xl space-y-2">
                <p className="text-xs font-black text-slate-700"><span className="text-slate-400 uppercase text-[9px]">Banco:</span> {affiliate.bankId || 'N/A'}</p>
                <p className="text-xs font-black text-primary"><span className="text-slate-400 uppercase text-[9px]">Cuenta:</span> {affiliate.bankAccountNumber || 'N/A'}</p>
                <p className="text-xs font-black text-slate-700"><span className="text-slate-400 uppercase text-[9px]">Titular:</span> {affiliate.bankAccountHolderName || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Respuestas de Evaluación</h4>
            {!answers ? (
              <p className="text-xs text-muted-foreground italic">No completó el examen técnico.</p>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Estrategia:</p>
                  <p className="text-xs font-medium text-slate-700 italic">"{answers.q1}"</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Experiencia:</p>
                  <p className="text-xs font-medium text-slate-700 italic">"{answers.q2}"</p>
                </div>
              </div>
            )}
          </div>

          {affiliate.status === 'Pending' && (
            <div className="flex gap-4 border-t pt-6">
              <Button className="flex-1 bg-green-600 hover:bg-green-700 font-bold" onClick={onApprove}>APROBAR AHORA</Button>
              <Button variant="destructive" className="flex-1 font-bold" onClick={onReject}>RECHAZAR</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

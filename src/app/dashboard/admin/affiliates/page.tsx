"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Loader2, 
  ShieldCheck, 
  User, 
  Settings2,
  Copy,
  Check,
  Link as LinkIcon,
  Trash2,
  UserPlus,
  Eye,
  FileCheck,
  CreditCard,
  X,
  UserCheck,
  Lock,
  Unlock,
  Banknote,
  DollarSign,
  AlertTriangle
} from 'lucide-react'
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
import { useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase'
import { collection, doc, setDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { adminDeleteUser, adminDeleteAllAffiliates } from '@/lib/auth-actions'
import { getGoogleDriveDirectLink } from '@/lib/utils'
import { sendAccountActivatedEmail, sendAccountStatusEmail, sendPayoutProcessedEmail } from '@/lib/email'

export default function AdminAffiliatesPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const affiliatesQuery = useMemoFirebase(() => collection(db, 'affiliates'), [db]);
  const { data: affiliates, isLoading } = useCollection(affiliatesQuery);

  const handleCopyRegisterLink = () => {
    const link = `${window.location.origin}/auth/register/affiliate`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast({ title: "Enlace Copiado", description: "Envía este link solo a personas autorizadas." });
  };

  const handleActivateAffiliate = async (aff: any) => {
    if (!db) return;
    setIsProcessing(aff.id);
    try {
      updateDocumentNonBlocking(doc(db, 'affiliates', aff.id), {
        status: 'Active',
        activatedAt: new Date().toISOString()
      });

      const notifId = `welcome_${aff.id}`;
      await setDoc(doc(db, 'notifications', notifId), {
        userId: aff.id,
        title: '💎 ¡Cuenta Activada!',
        message: 'Bienvenido a la red élite. Tu acceso al Marketplace Platinum y herramientas de IA ya está habilitado.',
        type: 'system',
        createdAt: new Date().toISOString(),
        isRead: false
      });

      if (aff.email) {
        await sendAccountActivatedEmail({
          to: aff.email,
          name: aff.firstName
        }).catch(err => console.error("Error email activación:", err));
      }

      toast({ title: "Socio Activado ✓", description: `La cuenta de ${aff.firstName} ahora es Platinum.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo activar la cuenta." });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleToggleBlock = async (aff: any) => {
    if (!db) return;
    const newStatus = aff.status === 'Blocked' ? 'Active' : 'Blocked';
    setIsProcessing(aff.id);
    try {
      updateDocumentNonBlocking(doc(db, 'affiliates', aff.id), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      const notifId = `status_${aff.id}_${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        userId: aff.id,
        title: newStatus === 'Blocked' ? '⚠️ Acceso Suspendido' : '🔓 Acceso Restaurado',
        message: newStatus === 'Blocked' 
          ? 'Tu acceso ha sido restringido por la administración. Contacta a soporte.' 
          : 'Tu cuenta ha sido reactivada. Ya puedes volver a operar.',
        type: 'system',
        createdAt: new Date().toISOString(),
        isRead: false
      });

      if (aff.email) {
        await sendAccountStatusEmail({
          to: aff.email,
          name: aff.firstName,
          status: newStatus
        }).catch(err => console.error("Error email estatus:", err));
      }

      toast({ 
        title: newStatus === 'Blocked' ? "Socio Bloqueado" : "Socio Desbloqueado", 
        description: `El acceso de ${aff.firstName} ha sido actualizado.` 
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cambiar el estado." });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleProcessPayment = async (aff: any) => {
    if (!db || !aff.currentBalance || aff.currentBalance <= 0) return;
    
    if (!confirm(`¿Confirmar pago de $${aff.currentBalance.toFixed(2)} a ${aff.firstName}? El saldo se reseteará a cero.`)) return;

    setIsProcessing(aff.id);
    try {
      const currentAmount = aff.currentBalance;
      
      updateDocumentNonBlocking(doc(db, 'affiliates', aff.id), {
        currentBalance: 0,
        lastPayoutAt: new Date().toISOString()
      });

      const notifId = `payout_${aff.id}_${Date.now()}`;
      await setDoc(doc(db, 'notifications', notifId), {
        userId: aff.id,
        title: '💰 ¡Pago Procesado!',
        message: `Se ha realizado el envío de $${currentAmount.toFixed(2)} USD a tu cuenta bancaria. ¡Felicidades!`,
        type: 'sale',
        createdAt: new Date().toISOString(),
        isRead: false
      });

      if (aff.email) {
        await sendPayoutProcessedEmail({
          to: aff.email,
          name: aff.firstName,
          amount: currentAmount
        }).catch(err => console.error("Error email pago:", err));
      }

      toast({ title: "Pago Liquidado ✓", description: `Se ha reseteado el saldo de ${aff.firstName}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar el pago." });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteAffiliate = async (uid: string) => {
    if(!confirm("¿ELIMINAR SOCIO DEFINITIVAMENTE? Esta acción borrará su acceso y su perfil.")) return;
    
    setIsDeleting(uid);
    try {
      const res = await adminDeleteUser(uid);
      if(res.success) {
        if (db) {
          deleteDocumentNonBlocking(doc(db, 'affiliates', uid));
          toast({ title: "Socio Eliminado ✓", description: "El acceso y el registro han sido removidos." });
        }
      } else {
        toast({ variant: "destructive", title: "Error", description: res.error || "No se pudo eliminar el acceso." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error Crítico", description: "Fallo en conexión administrativa." });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if(!confirm("⚠️ ADVERTENCIA: Esta acción eliminará a TODOS los afiliados del sistema (Auth y DB). No se puede deshacer. ¿Proceder?")) return;
    
    setIsDeletingAll(true);
    try {
      const res = await adminDeleteAllAffiliates();
      if (res.success) {
        toast({ title: "Limpieza Completada", description: `Se han eliminado ${res.count} registros de afiliados.` });
      } else {
        toast({ variant: "destructive", title: "Error", description: res.error });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error Fatal" });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const filteredAffiliates = (affiliates || []).filter(aff => 
    `${aff.firstName} ${aff.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight uppercase">Gestión de <span className="text-slate-500">Afiliados</span></h1>
            <p className="text-slate-500 text-sm font-medium">Control centralizado de la red de socios autorizados.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleDeleteAll} 
              variant="destructive" 
              disabled={isDeletingAll || (affiliates?.length || 0) === 0}
              className="h-12 px-6 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2"
            >
              {isDeletingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
              BORRADO NUCLEAR
            </Button>
            <Button 
              onClick={handleCopyRegisterLink} 
              variant="outline" 
              className="h-12 px-6 rounded-lg font-black text-[10px] uppercase tracking-widest gap-2 border-slate-300 bg-white"
            >
              {copiedLink ? <Check className="h-4 w-4 text-green-600" /> : <LinkIcon className="h-4 w-4" />}
              {copiedLink ? "ENLACE COPIADO" : "LINK DE REGISTRO PRIVADO"}
            </Button>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                className="pl-11 h-12 w-full sm:w-64 rounded-lg bg-white shadow-sm border-slate-200 text-xs font-bold" 
                placeholder="Buscar socio..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin text-slate-400" /></div>
        ) : filteredAffiliates.length === 0 ? (
          <Card className="p-20 text-center border-dashed border-2 border-slate-200 bg-white rounded-xl">
            <UserPlus className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sin registros activos</p>
          </Card>
        ) : (
          <Card className="premium-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 h-14">
                    <TableHead className="px-8 font-black uppercase text-[10px] text-slate-500">Socio Platinum</TableHead>
                    <TableHead className="font-black uppercase text-[10px] text-slate-500">Estado</TableHead>
                    <TableHead className="font-black uppercase text-[10px] text-slate-500">Saldo ($)</TableHead>
                    <TableHead className="px-8 text-right font-black uppercase text-[10px] text-slate-500">Acciones Maestras</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliates.map((aff) => (
                    <TableRow key={aff.id} className="h-16 border-b last:border-0 hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="px-8">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 overflow-hidden">
                            {aff.photoUrl ? (
                              <img src={getGoogleDriveDirectLink(aff.photoUrl)} className="w-full h-full object-cover" alt="" />
                            ) : aff.firstName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-xs uppercase text-slate-900">{aff.firstName} {aff.lastName}</p>
                            <p className="text-[10px] font-medium text-slate-400">{aff.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded-sm",
                          aff.status === 'Active' ? "border-green-200 text-green-600 bg-green-50" : 
                          aff.status === 'Blocked' ? "border-red-200 text-red-600 bg-red-50" :
                          "border-amber-200 text-amber-600 bg-amber-50 animate-pulse"
                        )}>
                          {aff.status === 'Active' ? 'VERIFICADO' : aff.status === 'Blocked' ? 'BLOQUEADO' : 'PENDIENTE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-black text-xs text-slate-900">${aff.currentBalance?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="px-8 text-right">
                        <div className="flex justify-end gap-2">
                          {aff.currentBalance > 0 && (
                            <Button 
                              size="sm" 
                              className="h-8 px-4 bg-primary hover:bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest gap-2 shadow-lg"
                              onClick={() => handleProcessPayment(aff)}
                              disabled={isProcessing === aff.id}
                            >
                              {isProcessing === aff.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Banknote className="h-3.5 w-3.5" />}
                              PAGAR
                            </Button>
                          )}
                          {aff.status === 'Pending' && (
                            <Button 
                              size="sm" 
                              className="h-8 px-4 bg-green-600 hover:bg-green-700 text-white font-black text-[9px] uppercase tracking-widest gap-2 shadow-lg"
                              onClick={() => handleActivateAffiliate(aff)}
                              disabled={isProcessing === aff.id}
                            >
                              {isProcessing === aff.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                              ACTIVAR
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "h-8 w-8 rounded-lg",
                              aff.status === 'Blocked' ? "text-green-500 hover:bg-green-50" : "text-amber-500 hover:bg-amber-50"
                            )}
                            onClick={() => handleToggleBlock(aff)}
                            disabled={isProcessing === aff.id}
                          >
                            {isProcessing === aff.id ? <Loader2 className="h-4 w-4 animate-spin" /> : aff.status === 'Blocked' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </Button>
                          <AffiliateDetailsDialog affiliate={aff} />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteAffiliate(aff.id)}
                            disabled={isDeleting === aff.id}
                          >
                            {isDeleting === aff.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}

function AffiliateDetailsDialog({ affiliate }: { affiliate: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-4 rounded-lg font-black text-[9px] uppercase tracking-widest gap-2">
          <Eye className="h-3.5 w-3.5" /> EXPEDIENTE
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl p-0 border-none shadow-2xl bg-white">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-xl overflow-hidden">
               {affiliate.photoUrl ? (
                 <img src={getGoogleDriveDirectLink(affiliate.photoUrl)} className="w-full h-full object-cover" alt="" />
               ) : <User className="h-6 w-6" />}
             </div>
             <div>
               <DialogTitle className="text-xl font-headline font-black uppercase italic tracking-tight">{affiliate.firstName} {affiliate.lastName}</DialogTitle>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">ID Socio: {affiliate.id}</p>
             </div>
          </div>
        </div>

        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-0.2em flex items-center gap-2">
                 <FileCheck className="h-4 w-4" /> Verificación Biométrica (KYC)
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Selfie / Rostro</p>
                    <div className="aspect-[4/5] rounded-xl bg-slate-100 overflow-hidden border">
                       {affiliate.photoUrl ? (
                         <img src={getGoogleDriveDirectLink(affiliate.photoUrl)} className="w-full h-full object-cover" alt="Selfie" />
                       ) : <div className="h-full w-full flex items-center justify-center text-slate-300 font-black text-[9px]">SIN FOTO</div>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Documento ID</p>
                    <div className="aspect-[4/5] rounded-xl bg-slate-100 overflow-hidden border">
                       {affiliate.idPhotoUrl ? (
                         <img src={getGoogleDriveDirectLink(affiliate.idPhotoUrl)} className="w-full h-full object-cover" alt="ID Document" />
                       ) : <div className="h-full w-full flex items-center justify-center text-slate-300 font-black text-[9px]">SIN ID</div>}
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-8">
               <div className="space-y-6">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-0.2em flex items-center gap-2">
                   <CreditCard className="h-4 w-4" /> Datos de Liquidación
                 </h3>
                 <div className="p-6 bg-slate-50 rounded-2xl space-y-4 border border-slate-100">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Banco</p>
                      <p className="text-sm font-black text-slate-900 uppercase">{affiliate.bankId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Nº de Cuenta</p>
                      <p className="text-lg font-black text-primary font-mono">{affiliate.bankAccountNumber || 'No registrada'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Titular</p>
                      <p className="text-xs font-bold text-slate-700 uppercase">{affiliate.bankAccountHolderName || 'N/A'}</p>
                    </div>
                 </div>
               </div>

               <div className="space-y-4">
                 <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Respuestas del Examen</h3>
                 <div className="space-y-3">
                   <div className="p-4 bg-white border rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">¿Cómo planeas promocionar?</p>
                      <p className="text-[11px] font-medium text-slate-700">"{affiliate.examAnswers?.q1 || 'N/A'}"</p>
                   </div>
                   <div className="p-4 bg-white border rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">Experiencia en ventas</p>
                      <p className="text-[11px] font-medium text-slate-700">"{affiliate.examAnswers?.q2 || 'N/A'}"</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

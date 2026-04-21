"use client"

import { useState, useEffect } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Mail, 
  Loader2, 
  Landmark, 
  Lock, 
  Unlock, 
  KeyRound, 
  MessageCircle, 
  ShieldCheck, 
  User, 
  FileText, 
  CheckCircle2, 
  BadgeDollarSign,
  Settings2,
  ShieldAlert,
  SendHorizontal,
  Zap,
  Scan,
  UserCheck,
  Trash2
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { sendEmail, sendNewPasswordAdmin, sendPaymentNotification } from '@/lib/email'
import { adminResetUserPassword, adminDeleteUser } from '@/lib/auth-actions'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function AdminAffiliatesPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const affiliatesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'affiliates');
  }, [db]);

  const { data: affiliates, isLoading } = useCollection(affiliatesQuery);

  const filteredAffiliates = (affiliates || []).filter(aff => 
    `${aff.firstName} ${aff.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <DashboardShell role="admin">
      <div className="space-y-8 md:space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Validación de Red de Mercadeo</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-headline font-black text-slate-900 tracking-tight leading-none uppercase italic">Gestión de <span className="text-primary">Afiliados Platinum</span></h1>
            <p className="text-slate-500 font-medium text-sm md:text-base">Revisa identidades biométricas, gestiona pagos y seguridad.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <Input 
              className="pl-14 h-14 md:h-16 rounded-2xl md:rounded-[1.5rem] border-none bg-white shadow-xl text-[16px] font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
              placeholder="Buscar afiliado..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading || isUserLoading ? (
          <div className="flex justify-center py-32"><Loader2 className="animate-spin text-primary h-12 w-12 opacity-50" /></div>
        ) : filteredAffiliates.length === 0 ? (
          <Card className="border-dashed border-4 flex flex-col items-center justify-center p-20 md:p-32 text-center bg-white/50 rounded-[3rem] md:rounded-[4rem] border-slate-100">
            <User className="h-16 w-16 md:h-20 md:w-20 text-slate-200 mb-8" />
            <h3 className="text-xl md:text-2xl font-black text-slate-400 mb-2">Sin afiliados registrados</h3>
            <p className="text-slate-400 max-w-sm font-bold text-xs md:text-sm leading-relaxed">Tu red de embajadores aparecerá aquí conforme se registren.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="hidden md:block border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 h-20 hover:bg-slate-50/50">
                        <TableHead className="px-10 font-black uppercase text-[10px] tracking-widest text-slate-400">Perfil del Embajador</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Estatus</TableHead>
                        <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Saldo Disponible</TableHead>
                        <TableHead className="px-10 text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Gestión Maestra</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAffiliates.map((aff) => (
                        <TableRow key={aff.id} className="h-24 border-b last:border-0 group hover:bg-slate-50/30 transition-colors">
                          <TableCell className="px-10">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shadow-inner group-hover:rotate-3 transition-transform overflow-hidden">
                                {aff.photoUrl ? (
                                  <img src={aff.photoUrl} alt="Selfie" className="h-full w-full object-cover" />
                                ) : (
                                  aff.firstName?.charAt(0)
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-black text-slate-800 uppercase tracking-tight">{aff.firstName} {aff.lastName}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{aff.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={aff.status} />
                          </TableCell>
                          <TableCell className="font-black text-lg text-primary tracking-tighter">
                            ${aff.currentBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                          </TableCell>
                          <TableCell className="px-10 text-right">
                            <PartnerControlCenter affiliate={aff} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredAffiliates.map((aff) => (
                <Card key={aff.id} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-slate-100 p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black overflow-hidden shadow-inner">
                        {aff.photoUrl ? (
                          <img src={aff.photoUrl} alt="Selfie" className="h-full w-full object-cover" />
                        ) : (
                          aff.firstName?.charAt(0)
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-slate-800 uppercase text-sm leading-tight">{aff.firstName} {aff.lastName}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{aff.email}</span>
                      </div>
                    </div>
                    <StatusBadge status={aff.status} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente</p>
                      <p className="text-xl font-black text-primary tracking-tighter">${aff.currentBalance?.toFixed(2) || '0.00'}</p>
                    </div>
                    <PartnerControlCenter affiliate={aff} isMobile />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn(
      "rounded-full font-black text-[9px] px-3 md:px-4 py-1.5 uppercase tracking-widest border-none shadow-sm", 
      status === 'Active' ? 'bg-green-100 text-green-600' : (status === 'Blocked' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600 animate-pulse')
    )}>
      {status === 'Pending' ? 'POR APROBAR' : (status === 'Active' ? 'ACTIVO ✓' : 'BLOQUEADO')}
    </Badge>
  );
}

function PartnerControlCenter({ affiliate, isMobile }: { affiliate: any, isMobile?: boolean }) {
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [open, setOpen] = useState(false);

  const kyc = affiliate.kyc || {};
  const exam = affiliate.examAnswers || {};

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await updateDocumentNonBlocking(doc(db, 'affiliates', affiliate.id), { status: 'Active' });
      await sendEmail({
        to: affiliate.email,
        subject: `✅ Cuenta Activada - Sync Connect`,
        text: `¡Hola ${affiliate.firstName}! Tu solicitud ha sido aprobada con éxito tras la validación biométrica. Ya puedes acceder a tu panel de afiliados.`
      });
      toast({ title: "Afiliado Activado", description: "Identidad confirmada y notificación enviada." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error en activación" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleBlock = async () => {
    const newStatus = affiliate.status === 'Blocked' ? 'Active' : 'Blocked';
    await updateDocumentNonBlocking(doc(db, 'affiliates', affiliate.id), { status: newStatus });
    toast({ 
      title: newStatus === 'Blocked' ? "Acceso Bloqueado" : "Acceso Restaurado",
      variant: newStatus === 'Blocked' ? "destructive" : "default"
    });
  };

  const handlePayBalance = async () => {
    if ((affiliate.currentBalance || 0) <= 0) {
      toast({ variant: "destructive", title: "Saldo Insuficiente", description: "El socio no tiene comisiones por cobrar." });
      return;
    }

    if (!confirm(`¿Confirmas que has realizado la transferencia de $${affiliate.currentBalance.toFixed(2)}?`)) return;

    setIsProcessing(true);
    const amountPaid = affiliate.currentBalance;
    const bankName = affiliate.bankId || 'Cuenta Registrada';

    try {
      await updateDocumentNonBlocking(doc(db, 'affiliates', affiliate.id), { currentBalance: 0 });

      await addDocumentNonBlocking(collection(db, 'notifications'), {
        userId: affiliate.id,
        title: '💰 Pago de Comisiones Realizado',
        message: `Se ha procesado un pago de $${amountPaid.toFixed(2)} a tu cuenta bancaria. ¡Felicidades!`,
        type: 'system',
        createdAt: new Date().toISOString(),
        isRead: false
      });

      await sendPaymentNotification({
        to: affiliate.email,
        name: affiliate.firstName,
        amount: amountPaid,
        bank: bankName
      });

      toast({ title: "¡Pago Registrado!", description: "Notificación enviada." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error al procesar pago" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAffiliate = async () => {
    setIsProcessing(true);
    try {
      const authRes = await adminDeleteUser(affiliate.id);
      
      if (!authRes.success) {
        toast({ variant: "destructive", title: "Fallo en Servidor", description: authRes.error });
        setIsProcessing(false);
        return;
      }

      await deleteDocumentNonBlocking(doc(db, 'affiliates', affiliate.id));
      
      toast({ title: "Afiliado Eliminado", description: "El registro y el acceso han sido borrados definitivamente." });
      setOpen(false);
    } catch (error: any) {
      console.error("Delete Error:", error);
      toast({ variant: "destructive", title: "Error al eliminar", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className={cn(
          "rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95",
          isMobile ? "h-12 w-12 p-0" : "h-12 px-6 text-[10px] gap-2"
        )}>
          <Settings2 className={cn(isMobile ? "h-5 w-5 text-primary" : "h-4 w-4 text-primary")} /> 
          {!isMobile && "GESTIONAR PERFIL"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-full h-[100dvh] md:h-[90vh] md:rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col">
        <div className="bg-slate-900 p-8 md:p-12 text-white shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-[2rem] bg-primary/20 border-2 border-primary/30 overflow-hidden shadow-2xl rotate-3 shrink-0">
                {affiliate.photoUrl ? (
                  <img src={affiliate.photoUrl} alt="Selfie" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary text-3xl font-black">{affiliate.firstName?.charAt(0)}</div>
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl md:text-4xl font-headline font-black text-white leading-tight uppercase italic">{affiliate.firstName} <span className="text-primary">{affiliate.lastName}</span></h2>
                <div className="flex items-center gap-3">
                  <StatusBadge status={affiliate.status} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">ID: {affiliate.id?.substring(0, 10)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
               <Button onClick={() => router.push('/dashboard/admin/support')} className="h-14 px-6 rounded-2xl bg-[#075E54] hover:bg-[#054c44] text-white font-black text-[10px] uppercase tracking-widest shadow-xl">
                 <MessageCircle className="mr-2 h-5 w-5" /> ESCRIBIR MENSAJE
               </Button>
               <Button onClick={handleToggleBlock} variant="outline" className={cn("h-14 px-6 rounded-2xl border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5", affiliate.status === 'Blocked' ? "bg-green-600 border-none" : "bg-red-600/20")}>
                 {affiliate.status === 'Blocked' ? <><Unlock className="mr-2 h-5 w-5" /> DESBLOQUEAR</> : <><Lock className="mr-2 h-5 w-5" /> BLOQUEAR ACCESO</>}
               </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="kyc" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 md:px-12 bg-slate-50 border-b shrink-0 overflow-x-auto no-scrollbar">
            <TabsList className="h-16 bg-transparent p-0 gap-8 min-w-max">
              <TabsTrigger value="kyc" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 transition-all">VERIFICACIÓN BIOMÉTRICA (KYC)</TabsTrigger>
              <TabsTrigger value="payments" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 transition-all">PAGOS Y COMISIONES</TabsTrigger>
              <TabsTrigger value="security" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 transition-all">SEGURIDAD ACCESO</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-8 md:p-12 pb-32">
            <TabsContent value="kyc" className="m-0 space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2"><UserCheck className="h-4 w-4" /> Comparación de Rostro vs ID</h4>
                    <Badge variant="outline" className="text-[8px] font-black uppercase">Confirmar Identidad</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-8">
                    <Card className="border-2 border-dashed p-6 bg-slate-50/50 rounded-[2.5rem] space-y-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Escaneo Facial en Tiempo Real</p>
                      <div className="relative aspect-square max-w-[280px] mx-auto rounded-full overflow-hidden border-[8px] border-white shadow-2xl ring-1 ring-slate-200">
                        {affiliate.photoUrl ? (
                          <img src={affiliate.photoUrl} alt="Selfie" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-slate-100 flex items-center justify-center"><User className="h-20 w-20 text-slate-300" /></div>
                        )}
                      </div>
                    </Card>
                    <Card className="border-2 border-dashed p-6 bg-slate-50/50 rounded-[2.5rem] space-y-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Documento de Identidad: {affiliate.kyc?.idType || 'ID'}</p>
                      <div className="relative aspect-video rounded-3xl overflow-hidden border-[8px] border-white shadow-2xl bg-slate-900 ring-1 ring-slate-200">
                        {affiliate.idPhotoUrl ? (
                          <img src={affiliate.idPhotoUrl} alt="ID Document" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-white/20"><Scan className="h-16 w-16" /></div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-black text-slate-900 uppercase">Nº: {affiliate.kyc?.idNumber || 'Sin Cargar'}</p>
                      </div>
                    </Card>
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2"><FileText className="h-4 w-4" /> Respuestas Examen Comercial</h4>
                  <div className="p-8 bg-slate-900 rounded-[3rem] text-white space-y-8">
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-primary uppercase">Estrategia de Promoción</p>
                      <p className="text-sm font-medium text-slate-300 italic leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/10">"{exam.q1 || 'Sin respuesta'}"</p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-primary uppercase">Experiencia en Ventas</p>
                      <p className="text-sm font-medium text-slate-300 italic leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/10">"{exam.q2 || 'Sin respuesta'}"</p>
                    </div>
                    <div className="pt-4">
                      <Alert className="bg-primary/10 border-primary/20 rounded-2xl">
                        <ShieldAlert className="h-4 w-4 text-primary" />
                        <AlertDescription className="text-[10px] font-bold text-primary uppercase leading-tight">
                          Verifica siempre que el número de cuenta coincida con el banco seleccionado antes de enviar el dinero.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="m-0 space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <Card className="lg:col-span-5 border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white p-10 relative overflow-hidden">
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl"><BadgeDollarSign className="h-6 w-6" /></div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-primary">Saldo por Liquidar</h3>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Comisiones Ganadas</p>
                      <h4 className="text-6xl font-black tracking-tighter italic text-white">${(affiliate.currentBalance || 0).toFixed(2)}</h4>
                    </div>
                    <Button onClick={handlePayBalance} disabled={isProcessing || (affiliate.currentBalance || 0) <= 0} className="w-full h-20 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/20 gap-3">
                      {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : <><SendHorizontal className="h-7 w-7" /> PAGAR AHORA</>}
                    </Button>
                  </div>
                </Card>

                <div className="lg:col-span-7 space-y-8">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><Landmark className="h-4 w-4" /> Datos de Pago Registrados</h4>
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 space-y-6">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Banco Destino</p>
                      <p className="text-xl font-black text-slate-900 uppercase">{affiliate.bankId || 'No proporcionado'}</p>
                    </div>
                    <div className="pt-6 border-t border-slate-200">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Número de Cuenta</p>
                      <p className="text-3xl md:text-4xl font-black text-slate-900 font-mono tracking-tighter break-all">{affiliate.bankAccountNumber || '----------------'}</p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase mt-2 italic">Titular: {affiliate.bankAccountHolderName || `${affiliate.firstName} ${affiliate.lastName}`}</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="m-0 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600"><KeyRound className="h-6 w-6" /></div>
                      <h3 className="text-sm font-black uppercase">Control de Credenciales</h3>
                    </div>
                    <AdminPasswordResetDialog user={affiliate} />
                  </Card>
                  
                  <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600"><ShieldAlert className="h-6 w-6" /></div>
                      <h3 className="text-sm font-black uppercase">Zona de Seguridad</h3>
                    </div>
                    <div className="space-y-3">
                      <Button onClick={handleToggleBlock} variant="outline" className="w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border-red-200 text-red-600">
                        {affiliate.status === 'Blocked' ? 'HABILITAR CUENTA' : 'BLOQUEAR ACCESO'}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full h-14 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-red-100">
                            <Trash2 className="h-4 w-4" /> ELIMINAR CUENTA DEFINITIVAMENTE
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-3xl font-headline font-black text-slate-900 tracking-tight">¿Confirmar Eliminación Total?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-bold leading-relaxed mt-4">
                              Esta acción es irreversible y realizará lo siguiente:
                              <ul className="list-disc pl-5 mt-3 space-y-2 text-xs">
                                <li>Borrará el perfil y datos bancarios de Firestore.</li>
                                <li><strong>Eliminará la cuenta de usuario de Google/Firebase Auth</strong> (el usuario ya no podrá iniciar sesión).</li>
                                <li>Se perderán todos los registros de saldo y KYC.</li>
                              </ul>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-10 gap-4">
                            <AlertDialogCancel className="h-14 rounded-2xl font-black text-slate-400 border-slate-100">CANCELAR</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAffiliate} disabled={isProcessing} className="h-14 rounded-2xl bg-destructive text-white font-black shadow-xl shadow-destructive/20">
                              {isProcessing ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "SÍ, ELIMINAR CUENTA Y ACCESO"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
               </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="p-6 md:p-10 border-t bg-slate-50 flex items-center justify-between sticky bottom-0 z-30">
          {affiliate.status === 'Pending' ? (
            <Button onClick={handleApprove} disabled={isProcessing} className="h-16 px-10 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase shadow-2xl transition-all hover:scale-[1.02] ring-4 ring-green-100">
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
              CONFIRMAR IDENTIDAD Y APROBAR
            </Button>
          ) : (
            <div className="flex items-center gap-3 text-green-600 bg-green-50 px-6 py-3 rounded-2xl border border-green-100">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Afiliado Verificado</span>
            </div>
          )}
          <Button variant="ghost" onClick={() => setOpen(false)} className="h-16 px-10 rounded-2xl font-black text-xs uppercase text-slate-400">SALIR DEL EXPEDIENTE</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminPasswordResetDialog({ user }: any) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const handleAutoReset = async () => {
    if (!confirm(`¿Generar nueva clave para ${user.firstName}?`)) return;
    setLoading(true);
    const newPass = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10);
    try {
      const res = await adminResetUserPassword(user.email, newPass);
      if (res.success) {
        await sendNewPasswordAdmin({ to: user.email, name: user.firstName, newPassword: newPass });
        toast({ title: "Clave Actualizada", description: "Nueva contraseña enviada por email." });
      }
    } catch (e: any) { 
      toast({ variant: "destructive", title: "Fallo", description: e.message }); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <Button variant="outline" className="w-full h-14 rounded-xl font-black text-[10px] uppercase border-amber-200 text-amber-700" onClick={handleAutoReset} disabled={loading}>
      {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <><KeyRound className="mr-2 h-5 w-5" /> REGENERAR CONTRASEÑA</>}
    </Button>
  );
}

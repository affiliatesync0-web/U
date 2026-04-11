"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Mail, 
  Loader2, 
  Landmark, 
  Lock, 
  Unlock, 
  Phone, 
  KeyRound, 
  MessageCircle, 
  ShieldCheck, 
  User, 
  FileText, 
  Camera, 
  CheckCircle2, 
  XCircle,
  Clock,
  ArrowUpRight,
  Wallet,
  BadgeDollarSign,
  Settings2,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  SendHorizontal
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { sendEmail, sendNewPasswordAdmin, sendPaymentNotification } from '@/lib/email'
import { adminResetUserPassword } from '@/lib/auth-actions'
import { cn, getGoogleDriveDirectLink } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminAffiliatesPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const affiliatesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'affiliates');
  }, [db]);

  const { data: affiliates, isLoading } = useCollection(affiliatesQuery);

  const filteredAffiliates = affiliates?.filter(aff => 
    `${aff.firstName} ${aff.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aff.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Gestión de Red de Mercadeo</span>
            </div>
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight leading-none uppercase italic">Panel de <span className="text-primary">Socios</span></h1>
            <p className="text-slate-500 font-medium">Control total sobre los perfiles, pagos y seguridad de tus afiliados.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <Input 
              className="pl-14 h-16 rounded-[1.5rem] border-none bg-white shadow-xl text-[16px] font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
              placeholder="Buscar por nombre o gmail..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32"><Loader2 className="animate-spin text-primary h-12 w-12 opacity-50" /></div>
        ) : filteredAffiliates.length === 0 ? (
          <Card className="border-dashed border-4 flex flex-col items-center justify-center p-32 text-center bg-white/50 rounded-[4rem] border-slate-100">
            <User className="h-20 w-20 text-slate-200 mb-8" />
            <h3 className="text-2xl font-black text-slate-400 mb-2">Sin socios registrados</h3>
            <p className="text-slate-400 max-w-sm font-bold text-sm leading-relaxed">Tu red de afiliados aparecerá aquí conforme se registren los nuevos prospectos.</p>
          </Card>
        ) : (
          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 h-20 hover:bg-slate-50/50">
                      <TableHead className="px-10 font-black uppercase text-[10px] tracking-widest text-slate-400">Perfil del Afiliado</TableHead>
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
                          <Badge className={cn(
                            "rounded-full font-black text-[9px] px-4 py-1.5 uppercase tracking-widest border-none shadow-sm", 
                            aff.status === 'Active' ? 'bg-green-100 text-green-600' : (aff.status === 'Blocked' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600 animate-pulse')
                          )}>
                            {aff.status === 'Pending' ? 'POR APROBAR' : (aff.status === 'Active' ? 'ACTIVO ✓' : 'BLOQUEADO')}
                          </Badge>
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
        )}
      </div>
    </DashboardShell>
  )
}

function PartnerControlCenter({ affiliate }: { affiliate: any }) {
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [open, setOpen] = useState(false);

  const kyc = affiliate.kyc;
  const exam = affiliate.examAnswers;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await updateDocumentNonBlocking(doc(db, 'affiliates', affiliate.id), { status: 'Active' });
      await sendEmail({
        to: affiliate.email,
        subject: `✅ Cuenta Activada - Sync Connect`,
        text: `¡Hola ${affiliate.firstName}! Tu solicitud ha sido aprobada con éxito. Ya puedes acceder a tu panel de afiliados.`
      });
      toast({ title: "Socio Activado", description: "Notificación enviada por email." });
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
      title: newStatus === 'Blocked' ? "Socio Bloqueado" : "Socio Desbloqueado",
      variant: newStatus === 'Blocked' ? "destructive" : "default"
    });
  };

  const handlePayBalance = async () => {
    if (affiliate.currentBalance <= 0) {
      toast({ variant: "destructive", title: "Saldo Insuficiente", description: "El socio no tiene comisiones por cobrar." });
      return;
    }

    if (!confirm(`¿Confirmas que has realizado la transferencia de $${affiliate.currentBalance.toFixed(2)} a ${affiliate.bankId}?`)) return;

    setIsProcessing(true);
    const amountPaid = affiliate.currentBalance;
    const bankName = affiliate.bankId || 'Cuenta Registrada';

    try {
      // 1. Resetear saldo en Firestore
      await updateDocumentNonBlocking(doc(db, 'affiliates', affiliate.id), { currentBalance: 0 });

      // 2. Enviar Notificación Interna
      await addDocumentNonBlocking(collection(db, 'notifications'), {
        userId: affiliate.id,
        title: '💰 Pago de Comisiones Realizado',
        message: `Se ha procesado un pago de $${amountPaid.toFixed(2)} a tu cuenta bancaria. ¡Felicidades!`,
        type: 'system',
        createdAt: new Date().toISOString(),
        isRead: false
      });

      // 3. ENVIAR GMAIL PROFESIONAL
      await sendPaymentNotification({
        to: affiliate.email,
        name: affiliate.firstName,
        amount: amountPaid,
        bank: bankName
      });

      toast({ title: "¡Pago Registrado!", description: "Saldo reseteado y notificación enviada por Gmail." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error al procesar pago" });
    } finally {
      setIsProcessing(false);
    }
  };

  const goToChat = () => {
    router.push('/dashboard/admin/support');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest shadow-xl gap-2 transition-all hover:scale-105 active:scale-95">
          <Settings2 className="h-4 w-4 text-primary" /> GESTIONAR SOCIO
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-full h-[100dvh] md:h-[90vh] md:rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col">
        {/* CABECERA */}
        <div className="bg-slate-900 p-8 md:p-12 text-white shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-[2rem] bg-primary/20 border-2 border-primary/30 overflow-hidden shadow-2xl rotate-3 shrink-0">
                {affiliate.photoUrl ? (
                  <img src={affiliate.photoUrl} alt="Selfie de identidad" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary text-3xl font-black">{affiliate.firstName?.charAt(0)}</div>
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl md:text-4xl font-headline font-black text-white leading-tight uppercase italic">{affiliate.firstName} <span className="text-primary">{affiliate.lastName}</span></h2>
                <div className="flex items-center gap-3">
                  <Badge className={cn("border-none text-[9px] font-black uppercase tracking-widest px-3 py-1", affiliate.status === 'Active' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white')}>
                    {affiliate.status === 'Active' ? 'AFILIADO ACTIVO ✓' : (affiliate.status === 'Pending' ? 'SOLICITUD PENDIENTE' : 'ACCESO BLOQUEADO')}
                  </Badge>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">UID: {affiliate.id.substring(0, 10)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
               <Button onClick={goToChat} className="h-14 px-6 rounded-2xl bg-[#075E54] hover:bg-[#054c44] text-white font-black text-[10px] uppercase tracking-widest shadow-xl">
                 <MessageCircle className="mr-2 h-5 w-5" /> ESCRIBIR MENSAJE
               </Button>
               <Button onClick={handleToggleBlock} variant="outline" className={cn("h-14 px-6 rounded-2xl border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5", affiliate.status === 'Blocked' ? "bg-green-600 border-none" : "bg-red-600/20")}>
                 {affiliate.status === 'Blocked' ? <><Unlock className="mr-2 h-5 w-5" /> DESBLOQUEAR</> : <><Lock className="mr-2 h-5 w-5" /> BLOQUEAR SOCIO</>}
               </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="payments" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 md:px-12 bg-slate-50 border-b shrink-0">
            <TabsList className="h-16 bg-transparent p-0 gap-8">
              <TabsTrigger value="payments" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 transition-all">PAGOS Y COMISIONES</TabsTrigger>
              <TabsTrigger value="kyc" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 transition-all">EXPEDIENTE / KYC</TabsTrigger>
              <TabsTrigger value="security" className="h-full rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 transition-all">SEGURIDAD ACCESO</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-8 md:p-12 pb-32">
            <TabsContent value="payments" className="m-0 space-y-10 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <Card className="lg:col-span-5 border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white p-10 relative overflow-hidden ring-8 ring-primary/5">
                  <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Wallet className="h-48 w-48" /></div>
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
                        <BadgeDollarSign className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-primary">Saldo por Liquidar</h3>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Comisiones Pendientes</p>
                      <h4 className="text-6xl font-black tracking-tighter italic text-white">${affiliate.currentBalance?.toFixed(2) || '0.00'}</h4>
                    </div>
                    <Button 
                      onClick={handlePayBalance} 
                      disabled={isProcessing || affiliate.currentBalance <= 0}
                      className="w-full h-20 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 gap-3"
                    >
                      {isProcessing ? <Loader2 className="animate-spin h-8 w-8" /> : <><SendHorizontal className="h-7 w-7" /> PAGAR AHORA</>}
                    </Button>
                    <p className="text-[9px] text-center font-bold text-slate-500 uppercase tracking-widest">Al pagar, el saldo se reseteará y se notificará por Gmail.</p>
                  </div>
                </Card>

                <div className="lg:col-span-7 space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Landmark className="h-4 w-4" /> Datos de Transferencia Bancaria
                    </h4>
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Banco Receptor</p>
                          <p className="text-xl font-black text-slate-900 uppercase">{affiliate.bankId || 'Sin Definir'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo de Cuenta</p>
                          <p className="text-lg font-bold text-slate-600">Ahorros / Corriente</p>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-slate-200">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Número de Cuenta (Clave)</p>
                        <p className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{affiliate.bankAccountNumber || '----------------'}</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase mt-2 italic">Titular: {affiliate.bankAccountHolderName || affiliate.firstName + ' ' + affiliate.lastName}</p>
                      </div>
                    </div>
                  </div>

                  <Alert className="bg-blue-50 border-blue-100 rounded-[2rem] p-6">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <AlertDescription className="text-[11px] font-bold text-blue-700 leading-relaxed uppercase">
                      Verifica siempre que el número de cuenta coincida con el banco seleccionado antes de enviar el dinero.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="kyc" className="m-0 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                    <Camera className="h-4 w-4" /> Validación Facial (Live)
                  </h4>
                  <div className="relative aspect-video rounded-[3rem] overflow-hidden border-[10px] border-slate-100 shadow-2xl group">
                    {affiliate.photoUrl ? (
                      <img src={affiliate.photoUrl} alt="Selfie" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    ) : (
                      <div className="h-full w-full bg-slate-100 flex items-center justify-center"><User className="h-20 w-20 text-slate-300" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-6 left-8 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg"><CheckCircle2 className="h-4 w-4" /></div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Identidad Capturada Live</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Examen Comercial
                  </h4>
                  <div className="p-8 bg-slate-900 rounded-[3rem] text-white space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><ArrowUpRight className="h-32 w-32" /></div>
                    <div className="space-y-6 relative z-10">
                      <div>
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-3">Estrategia de Promoción</p>
                        <p className="text-sm font-medium text-slate-300 leading-relaxed italic bg-white/5 p-5 rounded-2xl border border-white/10">"{exam?.q1 || 'Sin respuesta'}"</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-3">Experiencia en Ventas</p>
                        <p className="text-sm font-medium text-slate-300 leading-relaxed italic bg-white/5 p-5 rounded-2xl border border-white/10">"{exam?.q2 || 'Sin respuesta'}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="m-0 space-y-10 animate-in zoom-in-95 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner"><KeyRound className="h-6 w-6" /></div>
                      <h3 className="text-sm font-black uppercase">Reseteo de Credenciales</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Genera una nueva contraseña maestra para este socio. Se le notificará por email inmediatamente.</p>
                    <AdminPasswordResetDialog user={affiliate} />
                  </Card>

                  <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-inner"><ShieldAlert className="h-6 w-6" /></div>
                      <h3 className="text-sm font-black uppercase">Zona de Peligro</h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Bloquear el acceso impedirá que el socio entre a su panel, pero mantendrá sus ventas y saldo intactos.</p>
                    <Button onClick={handleToggleBlock} variant="destructive" className="w-full h-14 rounded-xl font-black text-[10px] uppercase tracking-widest">
                      {affiliate.status === 'Blocked' ? 'QUITAR BLOQUEO AHORA' : 'BLOQUEAR ACCESO INMEDIATO'}
                    </Button>
                  </Card>
               </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="p-6 md:p-10 border-t bg-slate-50 shrink-0 flex items-center justify-between absolute bottom-0 left-0 right-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          {affiliate.status === 'Pending' && (
            <Button onClick={handleApprove} disabled={isProcessing} className="h-16 px-10 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest shadow-2xl shadow-green-900/20 transition-all hover:scale-[1.02]">
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
              APROBAR SOLICITUD DE SOCIO
            </Button>
          )}
          <Button variant="ghost" onClick={() => setOpen(false)} className="h-16 px-10 rounded-2xl font-black text-xs uppercase text-slate-400">CERRAR CENTRO DE CONTROL</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminPasswordResetDialog({ user }: any) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const handleAutoReset = async () => {
    if (!confirm(`¿Deseas generar una nueva contraseña para ${user.firstName}?`)) return;
    setLoading(true);
    const newPass = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10);
    try {
      const res = await adminResetUserPassword(user.email, newPass);
      if (res.success) {
        await sendNewPasswordAdmin({ to: user.email, name: user.firstName, newPassword: newPass });
        toast({ title: "Clave Actualizada", description: "Nueva contraseña enviada al socio por email." });
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) { 
      toast({ variant: "destructive", title: "Fallo al resetear", description: e.message }); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <Button variant="outline" className="w-full h-14 rounded-xl font-black text-[10px] uppercase tracking-widest border-amber-200 text-amber-700 hover:bg-amber-50" onClick={handleAutoReset} disabled={loading}>
      {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <><KeyRound className="mr-2 h-5 w-5" /> GENERAR NUEVA CLAVE</>}
    </Button>
  );
}

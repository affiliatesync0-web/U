
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
  ArrowUpRight
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { sendEmail, sendNewPasswordAdmin } from '@/lib/email'
import { adminResetUserPassword } from '@/lib/auth-actions'
import { cn, getGoogleDriveDirectLink } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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

  const handleInternalContact = (affId: string) => {
    addDocumentNonBlocking(collection(db, 'notifications'), {
      userId: affId,
      title: '💬 Mensaje Privado Admin',
      message: 'Revisa tu panel de soporte para ver un nuevo mensaje privado del administrador.',
      type: 'system',
      createdAt: new Date().toISOString(),
      isRead: false,
      actionUrl: '/dashboard/affiliate/support'
    });

    toast({ 
      title: "Contacto Notificado", 
      description: "El socio ha recibido una alerta interna." 
    });

    router.push('/dashboard/admin/support');
  };

  const handleApprove = async (affId: string, affEmail: string, affName: string) => {
    const affRef = doc(db, 'affiliates', affId);
    updateDocumentNonBlocking(affRef, { status: 'Active' });
    try {
      await sendEmail({
        to: affEmail,
        subject: `✅ Cuenta Activada - Sync Connect`,
        text: `¡Hola ${affName}! Tu solicitud ha sido aprobada con éxito. Ya puedes acceder a tu panel de afiliados para empezar a generar comisiones.`
      });
      toast({ title: "Socio Aprobado", description: "Se ha enviado el correo de activación." });
    } catch (error) {
      toast({ title: "Socio Activo" });
    }
  };

  const handleToggleBlock = (affId: string, currentStatus: string) => {
    const affRef = doc(db, 'affiliates', affId);
    const newStatus = currentStatus === 'Blocked' ? 'Active' : 'Blocked';
    updateDocumentNonBlocking(affRef, { status: newStatus });
    toast({ 
      title: newStatus === 'Blocked' ? "Socio Bloqueado" : "Socio Desbloqueado",
      variant: newStatus === 'Blocked' ? "destructive" : "default"
    });
  };

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Control de Red de Mercadeo</span>
            </div>
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight leading-none uppercase italic">Gestión de <span className="text-primary">Socios</span></h1>
            <p className="text-slate-500 font-medium">Revisa perfiles, aprueba solicitudes y gestiona la seguridad de tus afiliados.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <Input 
              className="pl-14 h-16 rounded-[1.5rem] border-none bg-white shadow-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
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
                      <TableHead className="px-10 text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Expediente / Acciones</TableHead>
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
                          <div className="flex justify-end items-center gap-2">
                            <Button size="icon" variant="ghost" className="h-10 w-10 text-[#075E54] hover:bg-[#075E54]/5 rounded-xl" title="Mensaje WhatsApp Interno" onClick={() => handleInternalContact(aff.id)}>
                              <MessageCircle className="h-5 w-5" />
                            </Button>
                            
                            <AffiliateDetailsDialog 
                              affiliate={aff} 
                              onApprove={() => handleApprove(aff.id, aff.email, aff.firstName)} 
                            />
                            
                            <AdminPasswordResetDialog user={aff} />
                            
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className={cn("h-10 w-10 rounded-xl transition-all", aff.status === 'Blocked' ? "text-green-600 hover:bg-green-50" : "text-amber-600 hover:bg-amber-50")} 
                              onClick={() => handleToggleBlock(aff.id, aff.status)}
                              title={aff.status === 'Blocked' ? "Desbloquear" : "Bloquear acceso"}
                            >
                              {aff.status === 'Blocked' ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                            </Button>
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

function AffiliateDetailsDialog({ affiliate, onApprove }: any) {
  const kyc = affiliate.kyc;
  const exam = affiliate.examAnswers;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 rounded-xl font-black text-[10px] uppercase gap-2 border-slate-200">
          <FileText className="h-3.5 w-3.5" /> REVISAR EXPEDIENTE
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col">
        <div className="bg-slate-900 p-8 md:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-[1.5rem] bg-primary/20 border-2 border-primary/20 overflow-hidden shadow-2xl rotate-3 shrink-0">
              {affiliate.photoUrl ? (
                <img src={affiliate.photoUrl} alt="Selfie de identidad" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-primary text-2xl font-black">{affiliate.firstName?.charAt(0)}</div>
              )}
            </div>
            <div>
              <h2 className="text-3xl font-headline font-black text-white leading-tight uppercase italic">{affiliate.firstName} <span className="text-primary">{affiliate.lastName}</span></h2>
              <div className="flex items-center gap-3 mt-1">
                <Badge className="bg-primary text-white border-none text-[8px] font-black uppercase tracking-widest px-3 py-1">Solicitud de Socio</Badge>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Registrado: {new Date(affiliate.registeredAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          {affiliate.status === 'Pending' && (
            <Button className="h-14 px-8 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-xl shadow-green-900/20 uppercase text-xs tracking-widest" onClick={onApprove}>
              <CheckCircle2 className="mr-2 h-5 w-5" /> APROBAR SOCIO AHORA
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-8 md:p-12 space-y-12">
            {/* SECCIÓN 1: IDENTIDAD Y BANCO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> Validación KYC
                </h4>
                <div className="p-6 bg-slate-50 rounded-[2rem] border space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Documento de Identidad</p>
                    <p className="text-xs font-bold text-slate-500">{kyc?.idType || 'No Registrado'}</p>
                    <p className="text-xl font-black text-slate-900 font-mono mt-1">{kyc?.idNumber || '---'}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp de Contacto</p>
                    <p className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" /> +{affiliate.whatsappNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                  <Landmark className="h-4 w-4" /> Datos de Pago
                </h4>
                <div className="p-6 bg-slate-50 rounded-[2rem] border space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Banco Receptor</p>
                    <p className="text-lg font-black text-slate-900">{affiliate.bankId || 'Sin definir'}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Número de Cuenta</p>
                    <p className="text-xl font-black text-primary font-mono">{affiliate.bankAccountNumber || 'N/A'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Titular: {affiliate.bankAccountHolderName || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: EXAMEN DE VENTAS */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" /> Evaluación de Perfil Comercial
              </h4>
              <div className="grid grid-cols-1 gap-6">
                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <FileText className="h-32 w-32" />
                  </div>
                  <div className="space-y-4 relative z-10">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">¿Cómo planea promocionar los productos?</p>
                      <p className="text-sm font-medium text-slate-300 leading-relaxed italic bg-white/5 p-5 rounded-2xl border border-white/10">
                        "{exam?.q1 || 'Sin respuesta'}"
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">Experiencia previa en ventas digitales</p>
                      <p className="text-sm font-medium text-slate-300 leading-relaxed italic bg-white/5 p-5 rounded-2xl border border-white/10">
                        "{exam?.q2 || 'Sin respuesta'}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: SELFIE DE VERIFICACIÓN */}
            {affiliate.photoUrl && (
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                  <Camera className="h-4 w-4" /> Reconocimiento Facial (KYC)
                </h4>
                <div className="relative aspect-video max-w-lg mx-auto rounded-[3rem] overflow-hidden border-8 border-slate-50 shadow-inner group">
                  <img src={affiliate.photoUrl} alt="Selfie capturada" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-8 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Identidad Capturada Live</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-8 border-t bg-slate-50 shrink-0 flex justify-center">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center max-w-sm leading-relaxed">
            Esta información es estrictamente confidencial y se utiliza únicamente para el cumplimiento legal de pagos bancarios.
          </p>
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
        toast({ title: "Credenciales Sincronizadas", description: "Se han enviado al correo del socio." });
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) { 
      toast({ variant: "destructive", title: "Error al resetear", description: e.message }); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:text-primary transition-colors" onClick={handleAutoReset} disabled={loading}>
      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
    </Button>
  );
}

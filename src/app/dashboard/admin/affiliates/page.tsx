
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Mail, Loader2, Landmark, Lock, Unlock, Phone, KeyRound, MessageCircle, ShieldCheck } from 'lucide-react'
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
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { sendEmail, sendNewPasswordAdmin } from '@/lib/email'
import { adminResetUserPassword } from '@/lib/auth-actions'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function AdminAffiliatesPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const affiliatesQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user) return null;
    return collection(db, 'affiliates');
  }, [db, user, isUserLoading]);

  const { data: affiliates, isLoading } = useCollection(affiliatesQuery);

  const filteredAffiliates = affiliates?.filter(aff => 
    `${aff.firstName} ${aff.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    aff.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleInternalContact = (affId: string, type: 'message' | 'call') => {
    addDocumentNonBlocking(collection(db, 'notifications'), {
      userId: affId,
      title: type === 'call' ? '🚀 Llamada de Voz Entrante' : '💬 Mensaje Privado Admin',
      message: type === 'call' 
        ? 'El administrador solicita una llamada de voz privada contigo.' 
        : 'Revisa tu panel de soporte para ver un nuevo mensaje privado.',
      type: 'system',
      createdAt: new Date().toISOString(),
      isRead: false,
      actionUrl: '/dashboard/affiliate/support'
    });

    if (type === 'call') {
      const supportStatusRef = doc(db, 'site_config', 'support_status');
      setDocumentNonBlocking(supportStatusRef, {
        isLive: true,
        targetUserId: affId,
        startedAt: new Date().toISOString(),
        type: 'private'
      }, { merge: true });
    }

    toast({ 
      title: type === 'call' ? "Llamada Iniciada" : "Contacto Notificado", 
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
        text: `¡Hola ${affName}! Tu solicitud ha sido aprobada con éxito. Ya puedes acceder a tu panel de afiliados.`
      });
      toast({ title: "Socio Aprobado" });
    } catch (error) {
      toast({ title: "Socio Activo" });
    }
  };

  const handleToggleBlock = (affId: string, currentStatus: string) => {
    const affRef = doc(db, 'affiliates', affId);
    updateDocumentNonBlocking(affRef, { status: currentStatus === 'Blocked' ? 'Active' : 'Blocked' });
  };

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight leading-none uppercase italic">Directorio de <span className="text-primary">Socios</span></h1>
            <p className="text-slate-500 font-medium">Control nativo de la red y comunicación interna cifrada.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <Input 
              className="pl-14 h-16 rounded-[1.5rem] border-none bg-white shadow-xl text-sm font-bold" 
              placeholder="Buscar por nombre o gmail..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
        ) : (
          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="bg-slate-50/50 h-20">
                  <TableHead className="px-10 font-black uppercase text-[10px] tracking-widest text-slate-400">Perfil del Afiliado</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Estatus</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Saldo Disponible</TableHead>
                  <TableHead className="px-10 text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Comunicación Nativa</TableHead>
                </TableRow></TableHeader>
                <TableBody>{filteredAffiliates.map((aff) => (
                  <TableRow key={aff.id} className="h-24 border-b last:border-0 group">
                    <TableCell className="px-10">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 uppercase tracking-tight">{aff.firstName} {aff.lastName}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{aff.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("rounded-full font-black text-[9px] px-3 py-1 uppercase tracking-widest", 
                        aff.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600')}>
                        {aff.status || 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black text-lg text-primary">${aff.currentBalance?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell className="px-10 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button size="icon" variant="ghost" className="h-10 w-10 text-primary hover:bg-primary/5" title="Enviar Mensaje Interno" onClick={() => handleInternalContact(aff.id, 'message')}>
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-10 w-10 text-blue-600 hover:bg-blue-50" title="Iniciar Llamada de Voz" onClick={() => handleInternalContact(aff.id, 'call')}>
                          <Phone className="h-5 w-5" />
                        </Button>
                        <AffiliateDetailsDialog affiliate={aff} onApprove={() => handleApprove(aff.id, aff.email, aff.firstName)} />
                        <AdminPasswordResetDialog user={aff} />
                        <Button size="icon" variant="ghost" className="h-10 w-10 text-amber-600" onClick={() => handleToggleBlock(aff.id, aff.status)}>
                          {aff.status === 'Blocked' ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardShell>
  )
}

function AffiliateDetailsDialog({ affiliate, onApprove }: any) {
  const kyc = affiliate.kyc;
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline" size="sm" className="h-10 rounded-xl font-black text-[10px] uppercase">KYC / INFO</Button></DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
        <div className="bg-slate-900 p-10 text-white flex items-center justify-between">
          <h2 className="text-2xl font-black text-primary uppercase italic">Verificación <span className="text-white">KYC</span></h2>
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <div className="p-10 space-y-8 bg-white">
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Identidad Legal</p>
              <p className="text-xs font-black text-slate-500">{kyc?.idType || 'Documento No Registrado'}</p>
              <p className="text-lg font-black text-slate-900 font-mono mt-1">{kyc?.idNumber || '---'}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Información Bancaria</p>
              <p className="text-xs font-black text-slate-500">{affiliate.bankId || 'Sin definir'}</p>
              <p className="text-sm font-black text-slate-900 mt-1">{affiliate.bankAccountNumber || 'N/A'}</p>
            </div>
          </div>
          {affiliate.status === 'Pending' && <Button className="w-full h-16 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest" onClick={onApprove}>APROBAR SOCIO AHORA</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdminPasswordResetDialog({ user }: any) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const handleAutoReset = async () => {
    setLoading(true);
    const newPass = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 10);
    try {
      const res = await adminResetUserPassword(user.email, newPass);
      if (res.success) {
        await sendNewPasswordAdmin({ to: user.email, name: user.firstName, newPassword: newPass });
        toast({ title: "Credenciales Sincronizadas", description: "Se han enviado al correo del socio." });
      }
    } catch (e) { toast({ variant: "destructive", title: "Error al resetear" }); }
    finally { setLoading(false); }
  };
  return (
    <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400" onClick={handleAutoReset} disabled={loading}>
      {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
    </Button>
  );
}

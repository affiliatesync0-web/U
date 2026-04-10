
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Mail, ShieldCheck, Loader2, User, Landmark, Calendar, DollarSign, Lock, Unlock, Trash2, Banknote, ClipboardCheck, CheckCircle2, XCircle, Phone, Smartphone, Info, KeyRound, Copy, ExternalLink, AlertTriangle, Zap, MapPin, FileCheck, MessageCircle } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { sendEmail, sendNewPasswordAdmin } from '@/lib/email'
import { adminResetUserPassword } from '@/lib/auth-actions'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdminAffiliatesPage() {
  const { t } = useLanguage();
  const db = useFirestore();
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

  const handleNotifyContact = (affId: string, type: 'whatsapp' | 'call') => {
    // Enviar una notificación interna al afiliado para que vea un aviso en su panel
    addDocumentNonBlocking(collection(db, 'notifications'), {
      userId: affId,
      title: '📞 Intento de Contacto Admin',
      message: `El administrador está intentando contactarte por ${type === 'whatsapp' ? 'WhatsApp' : 'Llamada Directa'}. Por favor, mantente atento.`,
      type: 'system',
      createdAt: new Date().toISOString(),
      isRead: false
    });
  };

  const handleApprove = async (affId: string, affEmail: string, affName: string) => {
    const affRef = doc(db, 'affiliates', affId);
    updateDocumentNonBlocking(affRef, { status: 'Active' });
    try {
      await sendEmail({
        to: affEmail,
        subject: `✅ ¡Cuenta Activada! - Sync Connect`,
        text: `¡Felicidades ${affName}! Tu solicitud ha sido aprobada. Inicia sesión en: ${window.location.origin}/auth/login`
      });
      toast({ title: "Afiliado Aprobado" });
    } catch (error) {
      toast({ title: "Afiliado Activo" });
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
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight leading-none italic">{t.affiliateDirectory}</h1>
            <p className="text-slate-500 font-medium">Control total de la red de socios y verificación KYC.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <Input 
              className="pl-14 h-16 rounded-[1.5rem] border-none bg-white shadow-xl text-sm font-bold" 
              placeholder={t.search} 
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
                  <TableHead className="px-10 font-black uppercase text-[10px] tracking-widest text-slate-400">Afiliado</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Estatus</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Saldo</TableHead>
                  <TableHead className="px-10 text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Acciones</TableHead>
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
                        {aff.whatsappNumber && (
                          <>
                            <Button asChild size="icon" variant="ghost" className="h-10 w-10 text-green-600 hover:bg-green-50" onClick={() => handleNotifyContact(aff.id, 'whatsapp')}>
                              <a href={`https://wa.me/${aff.whatsappNumber.replace(/\D/g, '')}`} target="_blank"><MessageCircle className="h-5 w-5" /></a>
                            </Button>
                            <Button asChild size="icon" variant="ghost" className="h-10 w-10 text-blue-600 hover:bg-blue-50" onClick={() => handleNotifyContact(aff.id, 'call')}>
                              <a href={`tel:${aff.whatsappNumber.replace(/\D/g, '')}`}><Phone className="h-5 w-5" /></a>
                            </Button>
                          </>
                        )}
                        <AffiliateDetailsDialog affiliate={aff} t={t} onApprove={() => handleApprove(aff.id, aff.email, aff.firstName)} />
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

function AffiliateDetailsDialog({ affiliate, t, onApprove }: any) {
  const kyc = affiliate.kyc;
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline" size="sm" className="h-10 rounded-xl font-black text-[10px] uppercase">Detalles</Button></DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-slate-900 p-10 text-white"><h2 className="text-2xl font-black text-primary uppercase">Perfil de Verificación</h2></div>
        <div className="p-10 space-y-8 bg-white">
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-2xl border">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Identidad (KYC)</p>
              <p className="text-xs font-black">{kyc?.idType || 'N/A'}</p>
              <p className="text-lg font-black text-primary font-mono">{kyc?.idNumber || 'N/A'}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Cuenta Bancaria</p>
              <p className="text-xs font-black">{affiliate.bankId || 'Sin definir'}</p>
              <p className="text-sm font-black text-slate-800">{affiliate.bankAccountNumber || 'N/A'}</p>
            </div>
          </div>
          {affiliate.status === 'Pending' && <Button className="w-full h-16 bg-green-600 text-white font-black rounded-2xl shadow-xl" onClick={onApprove}>APROBAR SOCIO</Button>}
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
        toast({ title: "Clave Actualizada y Enviada" });
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

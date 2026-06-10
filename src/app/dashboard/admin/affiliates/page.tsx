"use client"

import { useState, useEffect } from 'react'
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
  UserPlus
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
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { collection } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function AdminAffiliatesPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const affiliatesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'affiliates');
  }, [db]);

  const { data: affiliates, isLoading } = useCollection(affiliatesQuery);

  const handleCopyRegisterLink = () => {
    const link = `${window.location.origin}/auth/register/affiliate`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast({ title: "Enlace Copiado", description: "Envía este link solo a personas autorizadas." });
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
                    <TableHead className="px-8 font-black uppercase text-[10px] text-slate-500">Socio</TableHead>
                    <TableHead className="font-black uppercase text-[10px] text-slate-500">Estado</TableHead>
                    <TableHead className="font-black uppercase text-[10px] text-slate-500">Saldo ($)</TableHead>
                    <TableHead className="px-8 text-right font-black uppercase text-[10px] text-slate-500">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliates.map((aff) => (
                    <TableRow key={aff.id} className="h-16 border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-8">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black">
                            {aff.firstName?.charAt(0)}
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
                          aff.status === 'Active' ? "border-green-200 text-green-600 bg-green-50" : "border-slate-200 text-slate-400 bg-slate-50"
                        )}>
                          {aff.status === 'Active' ? 'VERIFICADO' : 'PENDIENTE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-black text-xs">${aff.currentBalance?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="px-8 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-md">
                          <Settings2 className="h-4 w-4 text-slate-400" />
                        </Button>
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
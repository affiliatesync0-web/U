"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Mail, ShieldCheck, Loader2 } from 'lucide-react'
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'

export default function AdminAffiliatesPage() {
  const { t } = useLanguage();
  const db = useFirestore();

  const affiliatesQuery = useMemoFirebase(() => collection(db, 'affiliates'), [db]);
  const { data: affiliates, isLoading } = useCollection(affiliatesQuery);

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'Active': return t.active;
      case 'Pending': return t.pending;
      default: return 'Inactivo';
    }
  }

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

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !affiliates || affiliates.length === 0 ? (
          <Card className="border-dashed border-2 flex flex-col items-center justify-center p-12 text-center">
            <p className="text-muted-foreground mb-4">No hay afiliados registrados todavía.</p>
          </Card>
        ) : (
          <>
            {/* Mobile View */}
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
                      <Badge variant={aff.status === 'Active' ? 'default' : (aff.status === 'Pending' ? 'secondary' : 'outline')} className={aff.status === 'Active' ? 'bg-green-500' : ''}>
                        {getStatusLabel(aff.status || 'Pending')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                      <div>
                        <p className="text-muted-foreground uppercase text-[9px] font-bold mb-1">{t.bankName}</p>
                        <p className="font-medium">{aff.bankAccountNumber ? 'Registrada' : 'No registrada'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-[9px] font-bold mb-1">{t.balance}</p>
                        <p className="font-bold text-[#2870A3]">${aff.currentBalance?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs">
                        <Mail className="mr-2 h-3 w-3" /> {t.contact}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop View */}
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
                            <div className="font-bold text-[#2870A3]">${aff.currentBalance?.toFixed(2) || '0.00'}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={aff.status === 'Active' ? 'default' : (aff.status === 'Pending' ? 'secondary' : 'outline')} className={aff.status === 'Active' ? 'bg-green-500' : ''}>
                              {getStatusLabel(aff.status || 'Pending')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-[#A37EDC] hover:text-[#8e69c4] hover:bg-[#f3effb]">
                              <ShieldCheck className="mr-2 h-4 w-4" /> {t.review}
                            </Button>
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

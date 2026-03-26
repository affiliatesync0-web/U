
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Users2, Plus, Search, Loader2, Mail, Calendar, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'

export default function AffiliateBuyersPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const db = useFirestore()
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' })

  const buyersQuery = useMemoFirebase(() => collection(db, 'buyers'), [db])
  const { data: buyers, isLoading } = useCollection(buyersQuery)

  const handleSave = () => {
    const buyerId = formData.email.toLowerCase().trim()
    const buyerRef = doc(db, 'buyers', buyerId)
    
    setDocumentNonBlocking(buyerRef, {
      id: buyerId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: buyerId,
      registeredAt: new Date().toISOString()
    }, { merge: true })

    toast({
      title: t.language === 'es' ? "Comprador Registrado" : "Buyer Registered",
      description: `${formData.firstName} ha sido añadido a tu lista.`,
    })
    setIsAdding(false)
    setFormData({ firstName: '', lastName: '', email: '' })
  }

  const handleDelete = (id: string) => {
    const buyerRef = doc(db, 'buyers', id)
    deleteDocumentNonBlocking(buyerRef)
    toast({
      title: t.language === 'es' ? "Comprador Eliminado" : "Buyer Deleted",
      description: t.language === 'es' ? "El registro ha sido borrado." : "The record has been deleted.",
    })
  }

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users2 className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{t.buyers}</span>
            </div>
            <h1 className="text-3xl font-headline font-bold text-primary mb-2">{t.myCustomers}</h1>
            <p className="text-muted-foreground">{t.customerList}</p>
          </div>

          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold shadow-lg h-12 rounded-xl">
                <Plus className="mr-2 h-5 w-5" /> {t.registerBuyer}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-bold text-primary">{t.registerBuyer}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.firstName}</Label>
                    <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Juan" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t.lastName}</Label>
                    <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Pérez" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t.email}</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="juan@email.com" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAdding(false)}>{t.cancel}</Button>
                <Button className="bg-primary" onClick={handleSave}>{t.saveBuyer}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-sm overflow-hidden rounded-[1.5rem] bg-white">
          <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between py-4 px-6">
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input className="pl-7 h-8 text-xs bg-white" placeholder={t.search} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
            ) : !buyers || buyers.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">No tienes compradores registrados todavía.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/30">
                    <TableHead className="px-6">{t.firstName} {t.lastName}</TableHead>
                    <TableHead>{t.email}</TableHead>
                    <TableHead>{t.date}</TableHead>
                    <TableHead className="text-right px-6">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyers.map((buyer) => (
                    <TableRow key={buyer.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-6 font-bold text-slate-700">
                        {buyer.firstName} {buyer.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Mail className="h-3 w-3" /> {buyer.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Calendar className="h-3 w-3" /> {buyer.registeredAt ? new Date(buyer.registeredAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(buyer.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

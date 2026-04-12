
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
import { useFirestore, useCollection, useMemoFirebase, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc, query, where } from 'firebase/firestore'

export default function AffiliateBuyersPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' })

  const buyersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'buyers'), where('referredBy', '==', user.uid));
  }, [db, user]);

  const { data: buyers, isLoading } = useCollection(buyersQuery)

  const handleSave = () => {
    if (!user) return;
    const buyerId = formData.email.toLowerCase().trim()
    const buyerRef = doc(db, 'buyers', buyerId)
    
    setDocumentNonBlocking(buyerRef, {
      id: buyerId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: buyerId,
      referredBy: user.uid,
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
            <h1 className="text-3xl font-headline font-bold text-slate-900 mb-2">{t.myCustomers}</h1>
            <p className="text-slate-500">{t.customerList}</p>
          </div>

          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90 font-black shadow-xl h-14 rounded-2xl text-[10px] uppercase tracking-widest">
                <Plus className="mr-2 h-5 w-5" /> {t.registerBuyer}
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-headline font-black text-slate-900 uppercase italic">Nuevo <span className="text-primary">Prospecto</span></DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.firstName}</Label>
                    <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Juan" className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.lastName}</Label>
                    <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Pérez" className="h-12 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.email}</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="juan@email.com" className="h-12 rounded-xl" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl font-bold">{t.cancel}</Button>
                <Button className="bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest h-12 px-8" onClick={handleSave}>{t.saveBuyer}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-none shadow-2xl overflow-hidden rounded-[3rem] bg-white ring-1 ring-slate-100">
          <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center justify-between py-6 px-10">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input className="pl-10 h-10 text-xs bg-white border-slate-200 rounded-xl" placeholder={t.search} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-32"><Loader2 className="animate-spin text-primary h-10 w-10 opacity-50" /></div>
            ) : !buyers || buyers.length === 0 ? (
              <div className="text-center py-32 space-y-4 opacity-30">
                <Users2 className="h-16 w-16 mx-auto text-slate-300" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">No tienes compradores vinculados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30 h-16">
                      <TableHead className="px-10 font-black uppercase text-[10px] tracking-widest text-slate-400">{t.firstName} {t.lastName}</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">{t.email}</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">{t.date}</TableHead>
                      <TableHead className="text-right px-10 font-black uppercase text-[10px] tracking-widest text-slate-400">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyers.map((buyer) => (
                      <TableRow key={buyer.id} className="hover:bg-slate-50/50 transition-all h-20 border-b last:border-0 group">
                        <TableCell className="px-10">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs shadow-inner">
                              {buyer.firstName?.charAt(0)}
                            </div>
                            <span className="font-black text-slate-800 uppercase text-xs">{buyer.firstName} {buyer.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            <Mail className="h-3.5 w-3.5 opacity-40" /> {buyer.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <Calendar className="h-3.5 w-3.5" /> {buyer.registeredAt ? new Date(buyer.registeredAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-10">
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" onClick={() => handleDelete(buyer.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

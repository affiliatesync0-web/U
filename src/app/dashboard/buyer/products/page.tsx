
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Landmark, CreditCard, ShieldCheck, AlertTriangle, FileText } from 'lucide-react'
import Image from 'next/image'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import { useLanguage } from '@/components/language-context'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useState } from 'react'
import Link from 'next/link'

export default function BuyerProductsPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const productsQuery = useMemoFirebase(() => collection(db, 'products'), [db]);
  const { data: products, isLoading } = useCollection(productsQuery);

  const filteredProducts = (products || []).filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell role="buyer">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase text-primary tracking-[0.4em]">Tienda Sync Connect</span>
            </div>
            <h1 className="text-5xl font-headline font-black text-slate-900 leading-tight tracking-tight italic">Catálogo <span className="text-primary">VIP</span></h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">Accede a las mejores soluciones digitales con pago 100% garantizado.</p>
          </div>
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
            <Input 
              className="pl-16 h-20 rounded-[2.5rem] border-none bg-white shadow-xl text-lg font-bold" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32 opacity-20">
            <ShieldCheck className="h-20 w-20 mx-auto mb-4" />
            <p className="font-black uppercase tracking-widest">Próximamente más productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="border-none shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden flex flex-col rounded-[3.5rem] bg-white group ring-1 ring-slate-100">
                <div className="relative h-64 w-full overflow-hidden">
                  <Image 
                    src={product.imageUrl || 'https://picsum.photos/seed/product/600/400'} 
                    alt={product.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-1000" 
                    unoptimized={product.imageUrl?.startsWith('data:')}
                  />
                  <div className="absolute top-6 right-6">
                    <Badge className="bg-white/95 text-primary font-black px-5 py-2 rounded-2xl shadow-2xl border-none text-[9px] tracking-widest uppercase">
                      {product.category}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pt-8 pb-3 px-8 text-center">
                  <CardTitle className="text-2xl font-headline font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-2 min-h-[4rem] tracking-tight uppercase">
                    {product.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-10 pt-3 flex-1 flex flex-col gap-8">
                  <div className="flex items-center justify-center p-6 rounded-[2rem] bg-slate-50 border border-slate-100 shadow-inner">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Inversión Única</p>
                      <p className="font-black text-4xl text-slate-900 tracking-tighter">${product.price?.toFixed(2)}</p>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white font-black text-xl rounded-[2rem] h-20 shadow-2xl shadow-primary/30 transition-all duration-500">
                        COMPRAR AHORA
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white">
                      <div className="bg-slate-900 p-12 text-white text-center">
                         <CreditCard className="h-16 w-16 mx-auto mb-6 text-primary shadow-2xl" />
                         <DialogHeader>
                           <DialogTitle className="text-3xl font-headline font-black text-white text-center tracking-tighter italic">
                             Finalizar <span className="text-primary">Compra</span>
                           </DialogTitle>
                         </DialogHeader>
                      </div>
                      
                      <div className="p-10 space-y-8">
                        {product.paymentLink ? (
                          <div className="space-y-6">
                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                              <CreditCard className="h-5 w-5 text-blue-600" />
                              <p className="text-[10px] font-bold text-blue-700 uppercase">Acceso instantáneo mediante pago digital</p>
                            </div>
                            <Button asChild className="w-full h-20 rounded-[2rem] bg-primary text-white font-black text-lg shadow-2xl shadow-primary/20 gap-3 hover:scale-105 transition-all">
                              <Link href={`/checkout/${product.id}`} target="_blank">
                                <CreditCard className="h-6 w-6" /> PAGAR CON LINK SEGURO
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-8 animate-in fade-in">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                                <Landmark className="h-5 w-5" />
                              </div>
                              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Depósito Bancario</h3>
                            </div>

                            <div className="p-8 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 space-y-6 text-center">
                              <div className="grid grid-cols-2 gap-4 text-left">
                                <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase">{t.bankName}</p>
                                  <p className="font-black text-xs text-slate-800 uppercase">{product.payoutBankId || product.bankType}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase">Titular</p>
                                  <p className="font-black text-xs text-slate-800 uppercase">{product.payoutBankAccountHolderName || product.bankHolder}</p>
                                </div>
                                <div className="col-span-2 pt-4 border-t">
                                  <p className="text-[9px] font-black text-primary uppercase">Número de Cuenta</p>
                                  <p className="font-mono font-black text-2xl text-slate-900">{product.payoutBankAccountNumber || product.bankAccount}</p>
                                </div>
                              </div>
                              
                              <Button asChild className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-xl">
                                <Link href={`/checkout/${product.id}`}>
                                  CONTINUAR PARA SUBIR VOUCHER
                                </Link>
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                          <ShieldCheck className="h-6 w-6 text-green-600" />
                          <p className="text-[9px] font-black text-green-800 uppercase tracking-widest leading-relaxed">
                            Tu inversión está protegida por la tecnología Sync Connect.
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

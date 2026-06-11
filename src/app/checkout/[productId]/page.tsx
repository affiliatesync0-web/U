
"use client"

import { useState, Suspense, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking, useUser } from '@/firebase'
import { doc, collection } from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { Loader2, Truck, CreditCard, Landmark, ShieldCheck, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { sendOrderConfirmedEmail } from '@/lib/email'

function CheckoutContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  
  const productId = params.productId as string
  const affiliateId = searchParams.get('ref') || 'admin'

  useEffect(() => {
    if (!isUserLoading && !user) {
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
    }
  }, [user, isUserLoading, router]);

  const productRef = useMemoFirebase(() => doc(db, 'products', productId), [db, productId])
  const { data: product, isLoading: productLoading } = useDoc(productRef)

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    voucherRef: ''
  })

  useEffect(() => {
    if (user && !formData.email) {
      const names = (user.displayName || '').split(' ');
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || ''
      }));
    }
  }, [user, formData.email]);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.email || !formData.phone) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "Completa los campos obligatorios." })
      return
    }

    setLoading(true)

    try {
      const buyerId = formData.email.toLowerCase().trim()
      const buyerRef = doc(db, 'buyers', buyerId)
      
      setDocumentNonBlocking(buyerRef, {
        id: buyerId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: buyerId,
        phone: formData.phone.trim(),
        address: formData.address || '',
        city: formData.city || '',
        referredBy: affiliateId,
        registeredAt: new Date().toISOString()
      }, { merge: true })

      const saleAmount = product?.price || 0
      const commissionRate = product?.commissionRate || 0
      const commissionEarned = (saleAmount * commissionRate) / 100

      const saleData = {
        affiliateId: affiliateId,
        productId: productId,
        productName: product?.name || 'Producto Sync',
        productType: product?.type || 'Digital',
        buyerId: buyerId,
        buyerName: `${formData.firstName} ${formData.lastName}`,
        saleDate: new Date().toISOString(),
        saleAmount: saleAmount,
        commissionEarned: commissionEarned,
        productPayoutAmount: saleAmount - commissionEarned,
        status: 'Pending',
        paymentMethod: product?.paymentLink ? 'Pocket_Digital' : 'Transfer',
        voucherReference: formData.voucherRef.trim() || 'DIRECT_LINK_PURCHASE'
      }

      addDocumentNonBlocking(collection(db, 'sales'), saleData)

      await sendOrderConfirmedEmail({
        to: formData.email,
        name: formData.firstName,
        product: product?.name || 'Producto Sync',
        isPhysical: product?.type === 'Físico'
      }).catch(err => console.error("Error email checkout:", err));

      if (product?.paymentLink) {
        toast({ title: "Iniciando Pasarela", description: "Redirigiendo a pago seguro." })
        window.location.href = product.paymentLink;
      } else {
        toast({ title: "Registro Exitoso", description: "Tu solicitud está siendo procesada." })
        router.push('/dashboard/buyer');
      }

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Fallo al procesar la solicitud." })
      setLoading(false)
    }
  }

  if (isUserLoading || productLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Sincronizando Pasarela de Pago...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
           <Link href="/">
              <div className="relative h-10 w-32">
                 <span className="text-slate-900 font-black text-xl italic uppercase tracking-tighter">Sync<span className="text-primary">Connect</span></span>
              </div>
           </Link>
           <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <ShieldCheck className="h-4 w-4 text-green-600" /> Transacción Blindada
           </div>
        </div>

        <form onSubmit={handlePurchase} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-8">
            <Card className="border-none shadow-2xl rounded-2xl overflow-hidden ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-8">
                <CardTitle className="text-lg font-headline font-black uppercase italic flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-slate-900"><span className="text-xs">01</span></div>
                  Datos de Facturación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre Completo</Label>
                   <Input value={`${formData.firstName} ${formData.lastName}`} onChange={e => {
                     const parts = e.target.value.split(' ');
                     setFormData({...formData, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || ''})
                   }} className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold" required />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Dirección de E-mail</Label>
                   <Input type="email" value={formData.email} className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold opacity-50" disabled />
                 </div>
                 <div className="space-y-2 md:col-span-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp de contacto</Label>
                   <Input placeholder="50588888888" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold" required />
                 </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl rounded-2xl overflow-hidden ring-1 ring-slate-100">
              <CardHeader className="bg-slate-900 text-white p-8">
                <CardTitle className="text-lg font-headline font-black uppercase italic flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-slate-900"><span className="text-xs">02</span></div>
                  Método de Liquidación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10">
                {product?.paymentLink ? (
                  <div className="p-8 bg-green-50 rounded-2xl border-2 border-dashed border-green-200 text-center space-y-4">
                     <CreditCard className="h-10 w-10 text-green-600 mx-auto" />
                     <div>
                       <h4 className="font-black text-green-900 uppercase">Procesador de Pago Pocket</h4>
                       <p className="text-[11px] text-green-700 font-medium">Serás redirigido al portal oficial de pago tras confirmar tus datos.</p>
                     </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border ring-1 ring-black/5 space-y-4">
                      <div className="flex items-center gap-3">
                        <Landmark className="h-5 w-5 text-slate-900" />
                        <h4 className="font-black text-slate-900 uppercase text-xs">Transferencia Bancaria Directa</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[11px]">
                         <div><p className="text-slate-400 uppercase font-black">Banco:</p><p className="font-bold text-slate-900 uppercase">{product?.bankType || 'Sincronizando...'}</p></div>
                         <div><p className="text-slate-400 uppercase font-black">Nº Cuenta:</p><p className="font-mono font-bold text-slate-900">{product?.bankAccount || 'Consultar Admin'}</p></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Referencia del Voucher</Label>
                       <Input value={formData.voucherRef} onChange={e => setFormData({...formData, voucherRef: e.target.value})} className="h-14 rounded-xl bg-white border-none ring-1 ring-slate-200 font-black text-lg text-primary text-center" placeholder="Ej: 12345678" required />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6 sticky top-24">
             <Card className="border-none shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] rounded-[2.5rem] bg-slate-950 text-white overflow-hidden">
                <div className="p-10 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-2xl">
                       <Zap className="h-7 w-7 fill-current" />
                    </div>
                    <div>
                      <h3 className="text-xl font-headline font-black uppercase italic tracking-tight">Resumen de <span className="text-primary">Orden</span></h3>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Socio Ref: {affiliateId.substring(0,8)}</p>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-white/5 pt-8">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-400 uppercase">Producto seleccionado:</span>
                      <span className="text-xs font-black uppercase text-right max-w-[150px] truncate">{product?.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-6 border-t border-white/5">
                      <span className="text-lg font-black text-slate-400 uppercase italic">Total a liquidar:</span>
                      <span className="text-4xl font-black text-primary tracking-tighter">${product?.price?.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-20 rounded-2xl bg-primary hover:bg-primary/90 text-slate-950 font-black text-xl uppercase italic shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin h-7 w-7" /> : (
                      <>LIQUIDAR PEDIDO <ArrowRight className="h-6 w-6" /></>
                    )}
                  </Button>
                </div>
             </Card>

             <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4 text-[10px] text-blue-700 font-bold leading-relaxed">
                <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
                <p>Protección de datos bajo cifrado militar. Tu información de pago ocurre en un entorno controlado de Sync Connect.</p>
             </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <CheckoutContent />
    </Suspense>
  )
}

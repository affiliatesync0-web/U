
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
import { Loader2, Truck, CreditCard, Landmark, FileText } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { sendOrderConfirmedEmail } from '@/lib/email'

function CheckoutContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
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
      toast({ variant: "destructive", title: "Datos Incompletos", description: "Por favor llena tus datos de contacto." })
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
        productName: product?.name || 'Producto',
        productType: product?.type || 'Digital',
        buyerId: buyerId,
        buyerName: `${formData.firstName} ${formData.lastName}`,
        saleDate: new Date().toISOString(),
        saleAmount: saleAmount,
        commissionEarned: commissionEarned,
        productPayoutAmount: saleAmount - commissionEarned,
        status: 'Pending',
        paymentMethod: product?.type === 'Físico' ? 'cod' : (product?.paymentLink ? 'digital_link' : 'transfer'),
        voucherReference: formData.voucherRef.trim() || (product?.type === 'Físico' ? 'CASH_ON_DELIVERY' : 'LINK_DIRECTO')
      }

      addDocumentNonBlocking(collection(db, 'sales'), saleData)

      await sendOrderConfirmedEmail({
        to: formData.email,
        name: formData.firstName,
        product: product?.name || 'Producto Sync',
        isPhysical: product?.type === 'Físico'
      }).catch(err => console.error("Error enviando email compra:", err));

      if (product?.paymentLink && product?.type !== 'Físico') {
        toast({ title: "Redirigiendo...", description: "Abriendo pasarela de pago segura." })
        window.location.href = product.paymentLink;
      } else {
        toast({ title: "Pedido Registrado", description: product?.type === 'Físico' ? "Te contactaremos para la entrega." : "Tu solicitud está en proceso." })
        router.push('/dashboard/buyer');
      }

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No pudimos procesar la solicitud." })
      setLoading(false)
    }
  }

  if (isUserLoading || productLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Sincronizando pasarela de pago...</p>
      </div>
    );
  }

  const isPhysical = product?.type === 'Físico';

  return (
    <div className="min-h-screen bg-[#EAEDED] py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-4">
           <Link href="/" className="hover:outline hover:outline-1 hover:outline-slate-300 p-2 rounded-sm transition-all">
             <div className="relative h-8 w-24">
                <span className="text-[#111] font-black text-xl italic">Sync<span className="text-[#FF9900]">.Connect</span></span>
             </div>
           </Link>
           <div className="h-6 w-px bg-slate-300 mx-2" />
           <h1 className="text-2xl font-normal text-slate-800">Finalizar pedido</h1>
        </div>

        <form onSubmit={handlePurchase} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <Card className="premium-card">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg font-black flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center">1</span>
                  {isPhysical ? 'Dirección de envío' : 'Datos del Cliente'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1">
                   <Label className="text-[13px] font-bold text-[#111]">Nombre Completo</Label>
                   <Input value={`${formData.firstName} ${formData.lastName}`} onChange={e => {
                     const parts = e.target.value.split(' ');
                     setFormData({...formData, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || ''})
                   }} className="amazon-input" placeholder="Ej: Juan Pérez" required />
                 </div>
                 <div className="space-y-1">
                   <Label className="text-[13px] font-bold text-[#111]">E-mail</Label>
                   <Input type="email" value={formData.email} className="amazon-input" required disabled />
                 </div>
                 <div className="space-y-1">
                   <Label className="text-[13px] font-bold text-[#111]">Número de teléfono</Label>
                   <Input placeholder="50588888888" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="amazon-input" required />
                 </div>
                 {isPhysical && (
                   <>
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-[13px] font-bold text-[#111]">Dirección exacta</Label>
                      <Input placeholder="Barrio, de la iglesia 2c abajo..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="amazon-input" required />
                    </div>
                   </>
                 )}
              </CardContent>
            </Card>

            <Card className="premium-card">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg font-black flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center">2</span>
                  Método de pago
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {isPhysical ? (
                  <div className="flex gap-4 p-6 bg-blue-50 rounded-lg border border-blue-100">
                    <Truck className="h-8 w-8 text-blue-600 shrink-0" />
                    <p className="text-[13px] text-blue-700">Pago contra entrega en efectivo. Te llamaremos para coordinar.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {product?.paymentLink ? (
                      <div className="flex gap-4 p-6 bg-green-50 rounded-lg border border-green-100">
                        <CreditCard className="h-8 w-8 text-green-600 shrink-0" />
                        <p className="text-[13px] text-green-700">Serás redirigido al enlace de pago oficial tras confirmar tus datos.</p>
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 border rounded-lg space-y-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><Landmark className="h-4 w-4" /> Transferencia Bancaria</h4>
                        <p className="text-xs">Banco: {product?.bankType}</p>
                        <p className="text-sm font-black font-mono">{product?.bankAccount}</p>
                        <Input value={formData.voucherRef} onChange={e => setFormData({...formData, voucherRef: e.target.value})} className="amazon-input" placeholder="Nº Referencia del Voucher" required />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-4 sticky top-24">
             <Card className="premium-card p-6 border-2 border-primary/20">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-black font-bold h-12 rounded-md shadow-sm border border-[#F2C200] mb-4"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isPhysical ? 'Confirmar Pedido' : (product?.paymentLink ? 'Pagar Ahora' : 'Finalizar Compra'))}
                </Button>
                <div className="space-y-4 border-t pt-4">
                  <div className="flex justify-between text-lg font-black text-[#B12704]">
                    <span>Total del pedido:</span>
                    <span>${product?.price?.toFixed(2)}</span>
                  </div>
                </div>
             </Card>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <CheckoutContent />
    </Suspense>
  )
}

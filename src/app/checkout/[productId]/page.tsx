"use client"

import { useState, Suspense, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase'
import { doc, collection } from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { Loader2, ShieldCheck, ShoppingBag, ChevronLeft, Phone, MessageCircle, CreditCard, Landmark, FileText, Truck, MapPin } from 'lucide-react'
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
  
  const productId = params.productId as string
  const affiliateId = searchParams.get('ref') || 'admin'

  const productRef = useMemoFirebase(() => doc(db, 'products', productId), [db, productId])
  const { data: product, isLoading: productLoading } = useDoc(productRef)

  const affiliateRef = useMemoFirebase(() => affiliateId !== 'admin' ? doc(db, 'affiliates', affiliateId) : null, [db, affiliateId])
  const { data: affiliateData } = useDoc(affiliateRef)

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

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.email || !formData.phone) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "Por favor llena tus datos de contacto." })
      return
    }

    if (product?.type === 'Físico' && !formData.address) {
      toast({ variant: "destructive", title: "Dirección Requerida", description: "Dinos dónde entregar tu pedido." })
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
        buyerPhone: formData.phone.trim(),
        deliveryAddress: formData.address || 'N/A',
        saleDate: new Date().toISOString(),
        saleAmount: saleAmount,
        commissionEarned: commissionEarned,
        productPayoutAmount: saleAmount - commissionEarned,
        status: 'Pending',
        paymentMethod: product?.type === 'Físico' ? 'cod' : (product?.paymentLink ? 'digital_link' : 'transfer'),
        voucherReference: formData.voucherRef.trim() || (product?.type === 'Físico' ? 'CASH_ON_DELIVERY' : 'LINK_DIRECTO')
      }

      const salesRef = collection(db, 'sales')
      addDocumentNonBlocking(salesRef, saleData)

      // Enviar email con plantilla premium
      await sendOrderConfirmedEmail({
        to: formData.email,
        name: formData.firstName,
        product: product?.name || 'Producto Sync',
        isPhysical: product?.type === 'Físico'
      }).catch(err => console.error("Error enviando email compra:", err));

      toast({ title: "Pedido Registrado", description: product?.type === 'Físico' ? "Te contactaremos para la entrega." : "Tu solicitud está en proceso." })

      if (product?.paymentLink && product?.type !== 'Físico') {
        window.location.href = product.paymentLink;
      } else {
        router.push('/dashboard/buyer');
      }

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No pudimos procesar la solicitud." })
    } finally {
      setLoading(false)
    }
  }

  if (productLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Producto no encontrado</div>
  }

  const isPhysical = product.type === 'Físico';

  return (
    <div className="min-h-screen bg-[#EAEDED] py-8 px-4 relative">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-6">
            {/* DIRECCIÓN DE ENVÍO (SOLO FÍSICOS) */}
            <Card className="premium-card">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg font-black flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center">1</span>
                  {isPhysical ? 'Dirección de envío' : 'Datos del Alumno'}
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
                   <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="amazon-input" required />
                 </div>
                 <div className="space-y-1">
                   <Label className="text-[13px] font-bold text-[#111]">Número de teléfono</Label>
                   <Input placeholder="50588888888" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="amazon-input" required />
                   <p className="text-[11px] text-slate-500 italic">Se usará para coordinar la entrega.</p>
                 </div>
                 
                 {isPhysical && (
                   <>
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-[13px] font-bold text-[#111]">Dirección exacta</Label>
                      <Input placeholder="Barrio, de la iglesia 2c abajo..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="amazon-input" required />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[13px] font-bold text-[#111]">Ciudad / Departamento</Label>
                      <Input placeholder="Ej: Managua" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="amazon-input" required />
                    </div>
                   </>
                 )}
              </CardContent>
            </Card>

            {/* MÉTODO DE PAGO */}
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
                    <div>
                      <h4 className="font-bold text-blue-900">Pago contra entrega (Efectivo)</h4>
                      <p className="text-[13px] text-blue-700 leading-relaxed">
                        Paga al repartidor en efectivo en el momento de recibir tu paquete. 
                        Nuestros asesores te llamarán al <b>{formData.phone || 'número proporcionado'}</b> para confirmar la hora de llegada.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {product.paymentLink ? (
                      <div className="flex gap-4 p-6 bg-green-50 rounded-lg border border-green-100">
                        <CreditCard className="h-8 w-8 text-green-600 shrink-0" />
                        <div>
                          <h4 className="font-bold text-green-900">Pago Digital Seguro</h4>
                          <p className="text-[13px] text-green-700">Habilitación inmediata del contenido tras procesar el link de pago.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-6 bg-slate-50 border rounded-lg space-y-4">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2"><Landmark className="h-4 w-4" /> Transferencia Bancaria Local</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div><p className="text-slate-400 font-medium">Banco:</p><p className="font-bold">{product.payoutBankId || product.bankType}</p></div>
                            <div><p className="text-slate-400 font-medium">Titular:</p><p className="font-bold">{product.payoutBankAccountHolderName || product.bankHolder}</p></div>
                            <div className="col-span-2"><p className="text-slate-400 font-medium">Nº Cuenta:</p><p className="font-black text-lg font-mono text-primary">{product.payoutBankAccountNumber || product.bankAccount}</p></div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[13px] font-bold text-[#111]">Nº Referencia del Voucher</Label>
                          <Input value={formData.voucherRef} onChange={e => setFormData({...formData, voucherRef: e.target.value})} className="amazon-input" placeholder="Ingresa los dígitos de tu comprobante" required />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RESUMEN DEL PEDIDO */}
          <div className="lg:col-span-4 space-y-4 sticky top-24">
             <Card className="premium-card p-6 border-2 border-primary/20">
                <Button 
                  onClick={handlePurchase} 
                  disabled={loading}
                  className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-black font-bold h-12 rounded-md shadow-sm border border-[#F2C200] mb-4"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isPhysical ? 'Confirmar Pedido' : 'Finalizar y Pagar')}
                </Button>
                <p className="text-[11px] text-center text-slate-500 mb-6">Al realizar el pedido, aceptas las condiciones de uso y el aviso de privacidad de Sync Connect.</p>
                
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-bold text-sm">Resumen del pedido</h3>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-600">Productos:</span>
                    <span>${product.price?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-600">Envío y gestión:</span>
                    <span>$0.00</span>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex justify-between text-lg font-black text-[#B12704]">
                    <span>Total del pedido:</span>
                    <span>${product.price?.toFixed(2)}</span>
                  </div>
                </div>
             </Card>

             <Card className="premium-card p-4 bg-slate-50/50">
               <div className="flex gap-3">
                 <Image src={product.imageUrl || 'https://picsum.photos/seed/p/100/100'} alt="product" width={60} height={60} className="rounded-md object-cover border" unoptimized />
                 <div className="min-w-0">
                   <p className="text-[13px] font-bold text-slate-800 line-clamp-2">{product.name}</p>
                   <p className="text-[12px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{product.type || 'Digital'}</p>
                 </div>
               </div>
             </Card>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <CheckoutContent />
    </Suspense>
  )
}

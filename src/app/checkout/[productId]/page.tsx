
"use client"

import { useState, Suspense, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase'
import { doc, collection } from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CreditCard, ShieldCheck, Zap, ArrowRight, User, Mail, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { sendOrderConfirmedEmail } from '@/lib/email'

function CheckoutContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  
  const productId = params.productId as string
  const affiliateId = searchParams.get('ref') || 'admin'

  const productRef = useMemoFirebase(() => doc(db, 'products', productId), [db, productId])
  const { data: product, isLoading: productLoading } = useDoc(productRef)

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.email || !formData.phone) {
      toast({ variant: "destructive", title: "Datos Incompletos", description: "Por favor, completa todos los campos para continuar." })
      return
    }

    setLoading(true)

    try {
      const buyerId = formData.email.toLowerCase().trim()
      const buyerRef = doc(db, 'buyers', buyerId)
      
      // 1. Guardar/Actualizar Perfil del Comprador (Lead)
      setDocumentNonBlocking(buyerRef, {
        id: buyerId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: buyerId,
        phone: formData.phone.trim(),
        referredBy: affiliateId,
        registeredAt: new Date().toISOString(),
        status: 'Active'
      }, { merge: true })

      const saleAmount = product?.price || 0
      const commissionRate = product?.commissionRate || 0
      const commissionEarned = (saleAmount * commissionRate) / 100

      // 2. Registrar la Transacción en el Sistema
      const saleData = {
        affiliateId: affiliateId,
        productId: productId,
        productName: product?.name || 'Producto Sync',
        buyerId: buyerId,
        buyerName: `${formData.firstName} ${formData.lastName}`.trim(),
        buyerPhone: formData.phone.trim(),
        saleDate: new Date().toISOString(),
        saleAmount: saleAmount,
        commissionEarned: commissionEarned,
        status: 'Pending',
        paymentMethod: 'Pocket_Digital',
        voucherReference: 'POCKET_GATEWAY_PENDING'
      }

      addDocumentNonBlocking(collection(db, 'sales'), saleData)

      // 3. Enviar confirmación por email
      await sendOrderConfirmedEmail({
        to: formData.email,
        name: formData.firstName,
        product: product?.name || 'Producto Sync',
        isPhysical: product?.type === 'Físico'
      }).catch(err => console.error("Error email checkout:", err));

      // 4. Redirigir al link de pago externo (Pocket)
      if (product?.paymentLink) {
        toast({ title: "Registro Exitoso", description: "Redirigiendo al portal de pago seguro..." })
        setTimeout(() => {
          window.location.href = product.paymentLink;
        }, 1500);
      } else {
        toast({ 
          variant: "destructive", 
          title: "Error de Pasarela", 
          description: "Este producto no tiene una pasarela de pago configurada. Contacta al administrador." 
        })
        setLoading(false)
      }

    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo procesar tu registro. Revisa tu conexión." })
      setLoading(false)
    }
  }

  if (productLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Iniciando Pasarela Segura...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <Card className="max-w-md p-10 rounded-[2rem] border-none shadow-xl">
           <Zap className="h-12 w-12 text-slate-200 mx-auto mb-4" />
           <h2 className="text-xl font-black uppercase">Producto No Disponible</h2>
           <p className="text-slate-500 text-sm mt-2">El enlace de compra es inválido o el producto ha sido retirado.</p>
           <Button asChild className="mt-6 rounded-xl bg-slate-900">
             <Link href="/">VOLVER AL INICIO</Link>
           </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* HEADER SIMPLE */}
        <div className="flex items-center justify-between">
           <div className="relative h-10 w-32">
              <span className="text-slate-900 font-black text-xl italic uppercase tracking-tighter">Sync<span className="text-primary">Connect</span></span>
           </div>
           <div className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-400 tracking-widest bg-white px-4 py-2 rounded-full shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> Transacción Blindada
           </div>
        </div>

        <form onSubmit={handlePurchase} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LADO IZQUIERDO: FORMULARIO */}
          <div className="lg:col-span-7 space-y-8">
            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <CardHeader className="bg-slate-950 text-white p-10">
                <CardTitle className="text-xl font-headline font-black uppercase italic flex items-center gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-slate-950"><User className="h-5 w-5" /></div>
                  01. Datos del Comprador
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tu Nombre</Label>
                     <Input 
                      placeholder="Ej: Juan" 
                      value={formData.firstName} 
                      onChange={e => setFormData({...formData, firstName: e.target.value})} 
                      className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold px-6" 
                      required 
                     />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tu Apellido</Label>
                     <Input 
                      placeholder="Ej: Pérez" 
                      value={formData.lastName} 
                      onChange={e => setFormData({...formData, lastName: e.target.value})} 
                      className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold px-6" 
                      required 
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Correo Electrónico (Gmail preferible)</Label>
                   <div className="relative">
                     <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                     <Input 
                      type="email" 
                      placeholder="tu@email.com" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold pl-14" 
                      required 
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp de Contacto</Label>
                   <div className="relative">
                     <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                     <Input 
                      placeholder="50588888888" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold pl-14" 
                      required 
                     />
                   </div>
                   <p className="text-[9px] text-slate-400 italic px-1">Indispensable para enviarte los accesos una vez confirmado el pago.</p>
                 </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100 opacity-60">
              <CardHeader className="bg-slate-50 border-b p-10">
                <CardTitle className="text-xl font-headline font-black uppercase italic flex items-center gap-4 text-slate-400">
                  <div className="h-10 w-10 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400"><CreditCard className="h-5 w-5" /></div>
                  02. Método de Liquidación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10">
                <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                   <p className="text-[11px] text-slate-500 font-medium">Elige tu método de pago preferido tras completar el paso anterior.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LADO DERECHO: RESUMEN */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">
             <Card className="border-none shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] rounded-[3rem] bg-slate-950 text-white overflow-hidden">
                <div className="p-10 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-slate-950 shadow-2xl">
                       <Zap className="h-7 w-7 fill-current" />
                    </div>
                    <div>
                      <h3 className="text-xl font-headline font-black uppercase italic tracking-tight">Resumen de <span className="text-primary">Orden</span></h3>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Socio Ref: {affiliateId.substring(0,8).toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="space-y-6 border-t border-white/5 pt-8">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Producto seleccionado:</span>
                      <span className="text-sm font-black uppercase text-white leading-tight">{product.name}</span>
                    </div>
                    <div className="flex justify-between items-center py-8 border-y border-white/5">
                      <span className="text-lg font-black text-slate-400 uppercase italic">Inversión Total:</span>
                      <span className="text-5xl font-black text-primary tracking-tighter">${product.price?.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-20 rounded-3xl bg-primary hover:bg-primary/90 text-slate-950 font-black text-xl uppercase italic shadow-2xl shadow-primary/20 transition-all active:scale-95 gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin h-7 w-7" /> : (
                      <>FINALIZAR COMPRA <ArrowRight className="h-6 w-6" /></>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    <ShieldCheck className="h-4 w-4" /> Pagos Procesados por Sync Connect
                  </div>
                </div>
             </Card>

             <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-center gap-5">
                <div className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <p className="text-[10px] text-blue-800 font-bold leading-relaxed">
                  Tus datos están protegidos bajo protocolos de encriptación de grado militar. La redirección al pago es segura y directa.
                </p>
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

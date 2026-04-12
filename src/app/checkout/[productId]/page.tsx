
"use client"

import { useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase'
import { doc, collection, increment } from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { Loader2, ShieldCheck, ShoppingBag, ChevronLeft, Phone, MessageCircle, CreditCard, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { sendEmail } from '@/lib/email'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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
    voucherRef: ''
  })

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
        buyerId: buyerId,
        buyerName: `${formData.firstName} ${formData.lastName}`,
        saleDate: new Date().toISOString(),
        saleAmount: saleAmount,
        commissionEarned: commissionEarned,
        productPayoutAmount: saleAmount - commissionEarned,
        status: 'Pending', // Siempre inicia como pendiente
        paymentMethod: product?.paymentLink ? 'digital_link' : 'transfer',
        voucherReference: formData.voucherRef.trim() || 'LINK_DIRECTO'
      }

      const salesRef = collection(db, 'sales')
      addDocumentNonBlocking(salesRef, saleData)

      await sendEmail({
        to: formData.email,
        subject: `Registro de Compra - ${product?.name}`,
        text: `¡Hola ${formData.firstName}! Hemos registrado tu interés en ${product?.name}.\n\nSi pagaste mediante el link digital, tu acceso será validado en breve.`
      });

      // NO INCREMENTAR SALDO AQUÍ. Se hará cuando el admin apruebe.

      toast({ title: "Registro Exitoso", description: "Tu solicitud ha sido enviada para validación." })

      if (product?.paymentLink) {
        setTimeout(() => {
          window.location.href = product.paymentLink;
        }, 1500);
      } else {
        router.push('/auth/login');
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

  const affiliateWhatsApp = affiliateData?.whatsappNumber;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 relative">
      {affiliateWhatsApp && (
        <a 
          href={`https://wa.me/${affiliateWhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-green-500 text-white px-6 py-4 rounded-full shadow-2xl hover:scale-105 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Soporte Afiliado</span>
            <span className="text-sm font-black">Hablar con un asesor</span>
          </div>
        </a>
      )}

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-5 space-y-8">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-sm font-bold uppercase tracking-widest">
            <ChevronLeft className="h-4 w-4" /> Volver
          </Link>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight leading-none italic">
              Acceso <span className="text-primary">Instantáneo</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              Completa tus datos para habilitar el pago de <span className="font-bold text-slate-900">{product.name}</span>.
            </p>
          </div>

          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
            <div className="relative h-48 w-full">
              <Image 
                src={product.imageUrl || 'https://picsum.photos/seed/product/600/400'} 
                alt={product.name} 
                fill 
                className="object-cover"
                unoptimized={product.imageUrl?.startsWith('data:')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-8 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Resumen de Compra</p>
                <h3 className="text-xl font-headline font-black tracking-tight">{product.name}</h3>
              </div>
            </div>
            <CardContent className="p-10 space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-lg font-black text-slate-900 uppercase tracking-tighter">Total a Pagar</span>
                <span className="text-4xl font-black text-primary tracking-tighter">${product.price?.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/50 p-8 flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                 <ShieldCheck className="h-6 w-6" />
               </div>
               <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                 Compra 100% segura procesada por Sync Connect.
               </p>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <form onSubmit={handlePurchase} className="space-y-8">
            <Card className="border-none shadow-2xl rounded-[3.5rem] bg-white p-2">
              <div className="bg-slate-50/50 rounded-[3rem] p-8 md:p-12 space-y-10">
                
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Tus Datos de Acceso</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Nombre Completo</Label>
                      <Input 
                        required 
                        placeholder="Juan"
                        value={formData.firstName}
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                        className="h-14 rounded-2xl bg-white border-none ring-1 ring-slate-200 px-6 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Apellido</Label>
                      <Input 
                        required 
                        placeholder="Perez"
                        value={formData.lastName}
                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                        className="h-14 rounded-2xl bg-white border-none ring-1 ring-slate-200 px-6 font-bold"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Gmail de Alumno</Label>
                      <Input 
                        required 
                        type="email"
                        placeholder="tu@correo.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="h-14 rounded-2xl bg-white border-none ring-1 ring-slate-200 px-6 font-bold"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">WhatsApp</Label>
                      <div className="relative">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          required 
                          placeholder="50588888888"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="h-14 rounded-2xl bg-white border-none ring-1 ring-slate-200 pl-12 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {product.paymentLink ? (
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full h-20 bg-primary hover:bg-primary/90 text-white font-black text-xl rounded-[2rem] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02]"
                    >
                      {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                        <span className="flex items-center gap-3">
                          <CreditCard className="h-6 w-6" /> CONTINUAR AL PAGO SEGURO
                        </span>
                      )}
                    </Button>
                  ) : (
                    <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 text-center">
                      <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                      <p className="text-[10px] text-amber-700 font-bold mt-1">Este producto requiere pago manual.</p>
                    </div>
                  )}

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="manual" className="border-none">
                      <AccordionTrigger className="h-14 rounded-2xl bg-slate-100 px-6 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:no-underline">
                        PAGO MANUAL (SOLO EMERGENCIAS)
                      </AccordionTrigger>
                      <AccordionContent className="pt-6 space-y-6">
                        <div className="p-6 rounded-[2rem] bg-white border-2 border-dashed border-slate-200 space-y-4 text-center">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.bankName}</p>
                            <p className="text-sm font-black text-slate-800">{product.payoutBankId}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.accountNumber}</p>
                            <p className="text-2xl font-black text-primary font-mono">{product.payoutBankAccountNumber}</p>
                          </div>
                          <div className="space-y-2 pt-4">
                            <Label className="text-[9px] font-black uppercase text-slate-500">Nº de Referencia del Voucher</Label>
                            <Input 
                              placeholder="Escribe la referencia aquí" 
                              value={formData.voucherRef}
                              onChange={e => setFormData({...formData, voucherRef: e.target.value})}
                              className="h-12 rounded-xl text-center font-bold"
                            />
                          </div>
                          <Button onClick={handlePurchase} className="w-full h-14 rounded-xl bg-slate-900 text-white font-black text-xs">
                            COMPLETAR CON VOUCHER
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </Card>
          </form>
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

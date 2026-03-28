
"use client"

import { useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useFirestore, useDoc, useMemoFirebase, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase'
import { doc, collection, increment } from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { Loader2, Landmark, ShieldCheck, ShoppingBag, Sparkles, ChevronLeft, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    voucherRef: ''
  })

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // VALIDACIÓN ESTRICTA DE VOUCHER
    if (!formData.voucherRef.trim()) {
      toast({
        variant: "destructive",
        title: "Voucher Requerido",
        description: "Debes ingresar el número de referencia de tu depósito para continuar."
      })
      return
    }

    setLoading(true)

    try {
      const buyerId = formData.email.toLowerCase().trim()
      
      // 1. Registrar/Actualizar Comprador
      const buyerRef = doc(db, 'buyers', buyerId)
      setDocumentNonBlocking(buyerRef, {
        id: buyerId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: buyerId,
        referredBy: affiliateId,
        registeredAt: new Date().toISOString()
      }, { merge: true })

      // 2. Registrar la Venta
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
        status: 'Pending',
        paymentMethod: 'transfer',
        voucherReference: formData.voucherRef.trim(),
        cardInfo: null
      }

      const salesRef = collection(db, 'sales')
      addDocumentNonBlocking(salesRef, saleData)

      // 3. Crear Notificaciones automáticas
      const notificationsRef = collection(db, 'notifications')
      
      // Mensaje para el comprador
      addDocumentNonBlocking(notificationsRef, {
        userId: buyerId,
        title: t.purchasePendingTitle,
        message: t.purchasePendingMsg.replace('{product}', product?.name || '').replace('{ref}', formData.voucherRef),
        type: 'system',
        createdAt: new Date().toISOString(),
        isRead: false
      })

      // Mensaje para el afiliado (si existe)
      if (affiliateId && affiliateId !== 'admin') {
        addDocumentNonBlocking(notificationsRef, {
          userId: affiliateId,
          title: t.saleConfirmedTitle,
          message: t.saleConfirmedMsg.replace('{ref}', formData.voucherRef),
          type: 'sale',
          createdAt: new Date().toISOString(),
          isRead: false
        })

        // 4. Actualizar saldo del afiliado
        const affiliateRef = doc(db, 'affiliates', affiliateId)
        import('@/firebase/non-blocking-updates').then(({ updateDocumentNonBlocking }) => {
          updateDocumentNonBlocking(affiliateRef, {
            currentBalance: increment(commissionEarned)
          })
        })
      }

      toast({
        title: t.purchaseSuccess,
        description: t.purchaseSuccessDesc,
      })

      router.push('/auth/login?role=buyer')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No pudimos procesar tu compra."
      })
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

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Order Summary */}
        <div className="lg:col-span-5 space-y-8">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-primary transition-colors text-sm font-bold uppercase tracking-widest">
            <ChevronLeft className="h-4 w-4" /> Volver
          </Link>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight leading-none">
              Finaliza tu <span className="text-primary">Compra</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              Estás a un paso de acceder a <span className="font-bold text-slate-900">{product.name}</span>. Realiza tu depósito bancario para activar tu acceso.
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
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Resumen de Pedido</p>
                <h3 className="text-xl font-headline font-black tracking-tight">{product.name}</h3>
              </div>
            </div>
            <CardContent className="p-10 space-y-6">
              <div className="flex justify-between items-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <span>Precio del Producto</span>
                <span>${product.price?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                <span>Impuestos / Tasas</span>
                <span>$0.00</span>
              </div>
              <div className="h-px bg-slate-100" />
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
                 Pago protegido por tecnología de verificación Sync Connect.
               </p>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Checkout Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handlePurchase} className="space-y-8">
            <Card className="border-none shadow-2xl rounded-[3.5rem] bg-white p-2">
              <div className="bg-slate-50/50 rounded-[3rem] p-8 md:p-12 space-y-10">
                
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">{t.buyerInfo}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.firstName}</Label>
                      <Input 
                        required 
                        placeholder="Juan"
                        value={formData.firstName}
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                        className="h-14 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all px-6 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.lastName}</Label>
                      <Input 
                        required 
                        placeholder="Perez"
                        value={formData.lastName}
                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                        className="h-14 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all px-6 font-bold"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.email}</Label>
                      <Input 
                        required 
                        type="email"
                        placeholder="tu@correo.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="h-14 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all px-6 font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">{t.paymentMethod}: {t.bankTransfer}</h3>
                  </div>

                  <div className="space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-primary/5 border-2 border-dashed border-primary/20 space-y-6">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] text-center">Cuenta para Depósito</h4>
                      <div className="space-y-4 text-center">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.bankName}</p>
                          <p className="text-xl font-black text-slate-900 tracking-tight">{product.payoutBankId}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.accountNumber}</p>
                          <p className="text-3xl font-black font-mono text-primary tracking-widest">{product.payoutBankAccountNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.accountHolder}</p>
                          <p className="text-sm font-black text-slate-700">{product.payoutBankAccountHolderName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.voucherReference} <span className="text-destructive">*</span></Label>
                      <Input 
                        required
                        placeholder="Número de referencia del depósito"
                        value={formData.voucherRef}
                        onChange={e => setFormData({...formData, voucherRef: e.target.value})}
                        className="h-16 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-4 focus:ring-primary/10 transition-all px-6 font-black text-lg text-primary"
                      />
                    </div>

                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800 font-black text-[10px] uppercase tracking-widest">Aviso Importante</AlertTitle>
                      <AlertDescription className="text-amber-700 text-xs font-bold">
                        Tu acceso se habilitará automáticamente una vez que el administrador valide el número de referencia de tu pago.
                      </AlertDescription>
                    </Alert>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-20 bg-primary hover:bg-primary/90 text-white font-black text-xl rounded-[2rem] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 mt-6"
                  >
                    {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                      <span className="flex items-center gap-3">
                        <Sparkles className="h-6 w-6" /> {t.completePurchase.toUpperCase()}
                      </span>
                    )}
                  </Button>
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

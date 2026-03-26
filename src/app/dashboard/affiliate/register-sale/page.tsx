
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BadgeDollarSign, User, Mail, Tag, Landmark, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useUser, addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase'
import { collection, query, where, getDocs, doc, increment } from 'firebase/firestore'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function RegisterSalePage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const db = useFirestore()
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [productCode, setProductCode] = useState('')
  const [voucherReference, setVoucherReference] = useState('')
  const [buyerData, setBuyerData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })

  const handleRegisterSale = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // VALIDACIÓN ESTRICTA: Si no hay voucher, no se permite continuar
    if (!voucherReference.trim()) {
      toast({
        variant: "destructive",
        title: t.language === 'es' ? "Campo Obligatorio" : "Required Field",
        description: t.language === 'es' ? "Debes ingresar el número de referencia del voucher para registrar la venta." : "You must enter the voucher reference number to register the sale.",
      })
      return
    }

    if (!user || !db) return

    setLoading(true)
    
    try {
      // 1. Buscar producto por código
      const productsRef = collection(db, 'products')
      const q = query(productsRef, where('code', '==', productCode.toUpperCase()))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: t.language === 'es' ? "Error de Código" : "Code Error",
          description: t.language === 'es' ? "El código de producto no existe en nuestro catálogo." : "The product code does not exist in our catalog."
        })
        setLoading(false)
        return
      }

      const productDoc = querySnapshot.docs[0]
      const product = productDoc.data()
      
      // 2. Calcular comisión
      const saleAmount = product.price || 0
      const commissionRate = product.commissionRate || 0
      const commissionEarned = (saleAmount * commissionRate) / 100

      // 3. Registrar/Actualizar Comprador
      const buyerId = buyerData.email.toLowerCase().trim();
      const buyerRef = doc(db, 'buyers', buyerId);
      setDocumentNonBlocking(buyerRef, {
        id: buyerId,
        firstName: buyerData.firstName,
        lastName: buyerData.lastName,
        email: buyerId,
        registeredAt: new Date().toISOString()
      }, { merge: true });

      // 4. Registrar venta con referencia de voucher
      const saleData = {
        affiliateId: user.uid,
        productId: productDoc.id,
        productName: product.name,
        buyerId: buyerId,
        buyerName: `${buyerData.firstName} ${buyerData.lastName}`,
        saleDate: new Date().toISOString(),
        saleAmount: saleAmount,
        commissionEarned: commissionEarned,
        productPayoutAmount: saleAmount - commissionEarned,
        voucherReference: voucherReference.trim(),
        status: 'Completed'
      }

      const salesRef = collection(db, 'sales')
      addDocumentNonBlocking(salesRef, saleData)

      // 5. Actualizar saldo del afiliado (optimista con increment)
      const affiliateRef = doc(db, 'affiliates', user.uid)
      updateDocumentNonBlocking(affiliateRef, {
        currentBalance: increment(commissionEarned)
      })

      toast({
        title: t.language === 'es' ? "¡Venta Registrada Exitosamente!" : "Sale Registered Successfully!",
        description: t.language === 'es' ? `Se han sumado $${commissionEarned.toFixed(2)} a tu saldo acumulado.` : `$${commissionEarned.toFixed(2)} has been added to your balance.`,
      })
      
      // Limpiar formulario tras éxito
      setProductCode('')
      setVoucherReference('')
      setBuyerData({ firstName: '', lastName: '', email: '' })
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: t.language === 'es' ? "Error de Registro" : "Registration Error",
        description: t.language === 'es' ? "Hubo un problema técnico al procesar la venta. Inténtalo de nuevo." : "A technical problem occurred while processing the sale. Try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardShell role="affiliate">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">{t.registerSale}</h1>
          <p className="text-muted-foreground">Ingresa los datos de la transacción. Recuerda que la referencia del depósito es indispensable para validar tu comisión.</p>
        </div>

        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-bold">Atención</AlertTitle>
          <AlertDescription className="text-amber-700 text-xs">
            No se permite el registro de ventas sin un número de referencia de voucher válido. El administrador verificará este número antes de procesar pagos.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleRegisterSale}>
          <div className="grid gap-6">
            <Card className="border-none shadow-md ring-2 ring-primary/5">
              <CardHeader className="bg-primary/5 rounded-t-lg">
                <CardTitle className="text-lg font-headline flex items-center gap-2 text-primary">
                  <Landmark className="h-5 w-5" />
                  Paso 1: Comprobante de Pago (Obligatorio)
                </CardTitle>
                <CardDescription>Escribe el número que aparece en tu voucher de depósito o transferencia.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voucherRef" className="flex items-center gap-1">
                    {t.voucherReference} <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="voucherRef" 
                    placeholder="Ej: 00123456789" 
                    required 
                    value={voucherReference}
                    onChange={(e) => setVoucherReference(e.target.value)}
                    className="h-12 border-primary/30 focus:border-primary font-bold text-lg"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#A37EDC]" />
                  Paso 2: Detalles del Producto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productCode">Código del Producto <span className="text-destructive">*</span></Label>
                  <Input 
                    id="productCode" 
                    placeholder="Ej: MARKETING-01" 
                    required 
                    className="font-mono uppercase h-11" 
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <User className="h-5 w-5 text-[#A37EDC]" />
                  Paso 3: {t.buyerInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyerFirstName">{t.firstName} <span className="text-destructive">*</span></Label>
                    <Input 
                      id="buyerFirstName" 
                      placeholder="Nombre del cliente" 
                      required 
                      value={buyerData.firstName}
                      onChange={(e) => setBuyerData({...buyerData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerLastName">{t.lastName} <span className="text-destructive">*</span></Label>
                    <Input 
                      id="buyerLastName" 
                      placeholder="Apellido del cliente" 
                      required 
                      value={buyerData.lastName}
                      onChange={(e) => setBuyerData({...buyerData, lastName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {t.email} <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="buyerEmail" 
                    type="email" 
                    placeholder="correo@cliente.com" 
                    required 
                    value={buyerData.email}
                    onChange={(e) => setBuyerData({...buyerData, email: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full bg-[#A37EDC] hover:bg-[#8e69c4] text-white font-bold py-6 shadow-xl transition-all h-16 rounded-2xl" 
              disabled={loading}
            >
              {loading ? "Verificando Datos..." : (
                <span className="flex items-center gap-3 text-xl">
                  <BadgeDollarSign className="h-6 w-6" /> {t.confirmSale}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  )
}

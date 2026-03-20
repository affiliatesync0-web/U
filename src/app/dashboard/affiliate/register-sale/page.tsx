
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BadgeDollarSign, User, Mail, Tag, Landmark } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useUser, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase'
import { collection, query, where, getDocs, doc, increment } from 'firebase/firestore'

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
    if (!user || !db) return

    if (!voucherReference.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El número de referencia del voucher es obligatorio.",
      })
      return
    }

    setLoading(true)
    
    try {
      // 1. Buscar producto por código
      const productsRef = collection(db, 'products')
      const q = query(productsRef, where('code', '==', productCode.toUpperCase()))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "El código de producto no existe en el catálogo."
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

      // 3. Registrar venta
      const saleData = {
        affiliateId: user.uid,
        productId: productDoc.id,
        productName: product.name,
        buyerId: buyerData.email,
        buyerName: `${buyerData.firstName} ${buyerData.lastName}`,
        saleDate: new Date().toISOString(),
        saleAmount: saleAmount,
        commissionEarned: commissionEarned,
        productPayoutAmount: saleAmount - commissionEarned,
        voucherReference: voucherReference,
        status: 'Completed'
      }

      const salesRef = collection(db, 'sales')
      addDocumentNonBlocking(salesRef, saleData)

      // 4. Actualizar saldo del afiliado (optimista)
      const affiliateRef = doc(db, 'affiliates', user.uid)
      updateDocumentNonBlocking(affiliateRef, {
        currentBalance: increment(commissionEarned)
      })

      toast({
        title: "¡Venta registrada!",
        description: `Se han sumado $${commissionEarned.toFixed(2)} a tu saldo.`,
      })
      
      // Limpiar formulario
      setProductCode('')
      setVoucherReference('')
      setBuyerData({ firstName: '', lastName: '', email: '' })
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un problema al registrar la venta.",
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
          <p className="text-muted-foreground">Ingresa los datos reales de la venta y la referencia de depósito para recibir tu comisión.</p>
        </div>

        <form onSubmit={handleRegisterSale}>
          <div className="grid gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-[#A37EDC]" />
                  Comprobante de Depósito
                </CardTitle>
                <CardDescription>Indica el número de referencia del pago realizado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voucherRef">{t.voucherReference}</Label>
                  <Input 
                    id="voucherRef" 
                    placeholder="e.g. 987654321" 
                    required 
                    value={voucherReference}
                    onChange={(e) => setVoucherReference(e.target.value)}
                    className="h-12 border-primary/20"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#A37EDC]" />
                  Información del Producto
                </CardTitle>
                <CardDescription>Introduce el código del producto tal como aparece en el catálogo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productCode">{t.productCode}</Label>
                  <Input 
                    id="productCode" 
                    placeholder="e.g. MARKETING-01" 
                    required 
                    className="font-mono uppercase" 
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
                  {t.buyerInfo}
                </CardTitle>
                <CardDescription>Detalles del cliente para el registro de la transacción.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyerFirstName">{t.firstName}</Label>
                    <Input 
                      id="buyerFirstName" 
                      placeholder="Nombre del cliente" 
                      required 
                      value={buyerData.firstName}
                      onChange={(e) => setBuyerData({...buyerData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerLastName">{t.lastName}</Label>
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
                    <Mail className="h-4 w-4" /> {t.email}
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

            <Button type="submit" size="lg" className="w-full bg-[#A37EDC] hover:bg-[#8e69c4] text-white font-semibold py-6 shadow-md transition-all" disabled={loading}>
              {loading ? "Procesando Venta..." : (
                <span className="flex items-center gap-2 text-lg">
                  <BadgeDollarSign className="h-5 w-5" /> {t.confirmSale}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  )
}

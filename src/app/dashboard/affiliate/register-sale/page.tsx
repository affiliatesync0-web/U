"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BadgeDollarSign, User, Mail, Tag } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'

export default function RegisterSalePage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)

  const handleRegisterSale = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    setTimeout(() => {
      setLoading(false)
      toast({
        title: t.language === 'es' ? "Venta registrada con éxito" : "Sale registered successfully!",
        description: t.language === 'es' ? "La comisión ha sido añadida a tu saldo pendiente." : "The commission has been added to your pending balance.",
      })
    }, 1500)
  }

  return (
    <DashboardShell role="affiliate">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">{t.registerSale}</h1>
          <p className="text-muted-foreground">{t.language === 'es' ? "Registra una conversión exitosa ingresando los datos del comprador y del producto." : "Log a successful conversion by entering the buyer and product information."}</p>
        </div>

        <form onSubmit={handleRegisterSale}>
          <div className="grid gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#A37EDC]" />
                  {t.language === 'es' ? "Información del Producto" : "Product Information"}
                </CardTitle>
                <CardDescription>{t.language === 'es' ? "Ingresa el código único del producto o servicio vendido." : "Enter the unique code for the product or service sold."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productCode">{t.productCode}</Label>
                  <Input id="productCode" placeholder="e.g. EXCEL24" required className="font-mono" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <User className="h-5 w-5 text-[#A37EDC]" />
                  {t.buyerInfo}
                </CardTitle>
                <CardDescription>{t.language === 'es' ? "Ingresa los detalles del cliente para verificación." : "Enter the customer's details for verification."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyerFirstName">{t.firstName}</Label>
                    <Input id="buyerFirstName" placeholder="Maria" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerLastName">{t.lastName}</Label>
                    <Input id="buyerLastName" placeholder="Gonzalez" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {t.email}
                  </Label>
                  <Input id="buyerEmail" type="email" placeholder="customer@example.com" required />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full bg-[#A37EDC] hover:bg-[#8e69c4] text-white font-semibold py-6 shadow-md transition-all" disabled={loading}>
              {loading ? (t.language === 'es' ? "Registrando Venta..." : "Registering Sale...") : (
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

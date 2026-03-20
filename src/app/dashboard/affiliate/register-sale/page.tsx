
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BadgeDollarSign, User, Mail, Tag } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function RegisterSalePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleRegisterSale = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Sale registered successfully!",
        description: "The commission has been added to your pending balance.",
      })
      // Reset form or redirect
    }, 1500)
  }

  return (
    <DashboardShell role="affiliate">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">Register New Sale</h1>
          <p className="text-muted-foreground">Log a successful conversion by entering the buyer and product information.</p>
        </div>

        <form onSubmit={handleRegisterSale}>
          <div className="grid gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#A37EDC]" />
                  Product Information
                </CardTitle>
                <CardDescription>Enter the unique code for the product or service sold.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productCode">Product Code</Label>
                  <Input id="productCode" placeholder="e.g. EXCEL24" required className="font-mono" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <User className="h-5 w-5 text-[#A37EDC]" />
                  Buyer Information
                </CardTitle>
                <CardDescription>Enter the customer's details for verification.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyerFirstName">First Name</Label>
                    <Input id="buyerFirstName" placeholder="Maria" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buyerLastName">Last Name</Label>
                    <Input id="buyerLastName" placeholder="Gonzalez" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyerEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email Address
                  </Label>
                  <Input id="buyerEmail" type="email" placeholder="customer@example.com" required />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full bg-[#A37EDC] hover:bg-[#8e69c4] text-white font-semibold py-6 shadow-md transition-all" disabled={loading}>
              {loading ? "Registering Sale..." : (
                <span className="flex items-center gap-2 text-lg">
                  <BadgeDollarSign className="h-5 w-5" /> Confirm and Submit Sale
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardShell>
  )
}

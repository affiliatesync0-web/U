
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Tag, DollarSign, Percent } from 'lucide-react'
import Image from 'next/image'

export default function AffiliateProductsPage() {
  const products = [
    { id: "P-101", name: "Excel Mastery Course", type: "Course", price: "$49.99", commission: "20%", code: "EXCEL24", image: "https://picsum.photos/seed/nica2/400/300" },
    { id: "P-102", name: "SEO Optimization Service", type: "Service", price: "$199.00", commission: "15%", code: "SEO-OPT", image: "https://picsum.photos/seed/nica3/400/300" },
    { id: "P-103", name: "Modern Cookery Ebook", type: "Infoproduct", price: "$12.50", commission: "40%", code: "COOK2024", image: "https://picsum.photos/seed/nica4/400/300" },
    { id: "P-104", name: "Personalized Coaching", type: "Service", price: "$75.00", commission: "25%", code: "COACH-X", image: "https://picsum.photos/seed/nica5/400/300" },
    { id: "P-105", name: "Digital Art Pack", type: "Digital Product", price: "$29.00", commission: "30%", code: "ART-PK", image: "https://picsum.photos/seed/nica6/400/300" },
  ]

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary mb-2">Available Products</h1>
            <p className="text-muted-foreground">Browse our catalog and pick products to promote.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search products..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="border-none shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="relative h-48 w-full">
                <Image src={product.image} alt={product.name} fill className="object-cover" />
                <Badge className="absolute top-2 right-2 bg-primary/90">{product.type}</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-lg font-headline font-bold">{product.name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-3 w-3" />
                  <span>Code: <span className="font-mono font-bold text-primary">{product.code}</span></span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Price
                    </p>
                    <p className="font-bold text-lg">{product.price}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                      <Percent className="h-3 w-3" /> Commission
                    </p>
                    <p className="font-bold text-lg text-green-600">{product.commission}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 pt-4">
                <Button className="w-full font-semibold" variant="outline">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  )
}

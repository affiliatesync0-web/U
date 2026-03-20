
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, ShoppingBag, UserCheck, Calendar, Filter } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function AdminSalesPage() {
  const allSales = [
    { id: "S-5001", date: "2024-05-20", product: "Excel Course", buyer: "Carlos M.", buyerEmail: "cm@example.com", affiliate: "Juan P.", amount: "$49.99", commission: "$9.99", status: "Completed" },
    { id: "S-5002", date: "2024-05-19", product: "SEO Package", buyer: "Elena R.", buyerEmail: "elena@corp.ni", affiliate: "Maria L.", amount: "$199.00", commission: "$29.85", status: "Completed" },
    { id: "S-5003", date: "2024-05-19", product: "Digital Art Pack", buyer: "Luis V.", buyerEmail: "luis.v@gmail.com", affiliate: "Juan P.", amount: "$29.00", commission: "$8.70", status: "Completed" },
    { id: "S-5004", date: "2024-05-18", product: "Excel Course", buyer: "Ana S.", buyerEmail: "anas@outlook.com", affiliate: "Sonia G.", amount: "$49.99", commission: "$9.99", status: "Pending" },
  ]

  return (
    <DashboardShell role="admin">
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary mb-2">Global Sales Logs</h1>
            <p className="text-sm md:text-base text-muted-foreground">Comprehensive record of every transaction recorded by affiliates.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10 text-sm h-10" placeholder="Search sale ID, buyer, or affiliate..." />
            </div>
            <div className="flex gap-2">
               <Button variant="outline" className="flex-1 sm:flex-none"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
               <Button variant="outline" size="icon" className="hidden sm:flex"><Calendar className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {/* Mobile-only sales cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {allSales.map((sale) => (
            <Card key={sale.id} className="border-none shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1 rounded">{sale.id}</span>
                    <h3 className="font-bold text-sm mt-1">{sale.product}</h3>
                  </div>
                  <Badge variant={sale.status === 'Completed' ? 'default' : 'secondary'} className="text-[10px]">
                    {sale.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground uppercase text-[9px] font-bold">Buyer</p>
                    <p className="font-medium">{sale.buyer}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground uppercase text-[9px] font-bold">Affiliate</p>
                    <p className="text-primary font-medium">{sale.affiliate}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-lg font-bold">{sale.amount}</div>
                  <div className="text-sm font-bold text-green-600">Comm: {sale.commission}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop-only sales table */}
        <Card className="hidden md:block border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono font-bold text-xs">{sale.id}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{sale.date}</TableCell>
                      <TableCell className="font-semibold">{sale.product}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{sale.buyer}</div>
                        <div className="text-[10px] text-muted-foreground">{sale.buyerEmail}</div>
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline" className="text-[#A37EDC] border-[#A37EDC]">{sale.affiliate}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{sale.amount}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{sale.commission}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

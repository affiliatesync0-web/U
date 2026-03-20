
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Mail, Phone, ExternalLink, ShieldCheck, MoreVertical } from 'lucide-react'
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

export default function AdminAffiliatesPage() {
  const affiliates = [
    { id: "AF-101", name: "Juan Alberto Perez", email: "juan.perez@gmail.com", bank: "BAC Credomatic", balance: "$425.50", joined: "2024-01-15", status: "Active" },
    { id: "AF-102", name: "Maria Elena Lopez", email: "maria.l@gmail.com", bank: "Banpro", balance: "$1,240.00", joined: "2024-01-18", status: "Active" },
    { id: "AF-103", name: "Roberto Carlos Mejia", email: "rc.mejia@gmail.com", bank: "Lafise", balance: "$12.00", joined: "2024-02-01", status: "Pending" },
    { id: "AF-104", name: "Sonia Guevara", email: "sonia.g@gmail.com", bank: "Ficohsa", balance: "$0.00", joined: "2024-03-10", status: "Active" },
    { id: "AF-105", name: "Oscar Danilo Perez", email: "oscar.perez@gmail.com", bank: "BDF", balance: "$85.20", joined: "2024-03-12", status: "Inactive" },
  ]

  return (
    <DashboardShell role="admin">
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary mb-2">Affiliate Directory</h1>
            <p className="text-sm md:text-base text-muted-foreground">Manage your network of active affiliates and their payouts.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-10 h-10" placeholder="Search by name or bank..." />
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {affiliates.map((aff) => (
            <Card key={aff.id} className="border-none shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {aff.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{aff.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">{aff.id}</p>
                    </div>
                  </div>
                  <Badge variant={aff.status === 'Active' ? 'default' : (aff.status === 'Pending' ? 'secondary' : 'outline')} className={aff.status === 'Active' ? 'bg-green-500' : ''}>
                    {aff.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                  <div>
                    <p className="text-muted-foreground uppercase text-[9px] font-bold mb-1">Bank</p>
                    <p className="font-medium">{aff.bank}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground uppercase text-[9px] font-bold mb-1">Balance</p>
                    <p className="font-bold text-[#2870A3]">{aff.balance}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <Mail className="mr-2 h-3 w-3" /> Contact
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <ShieldCheck className="mr-2 h-3 w-3" /> Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop View: Table */}
        <Card className="hidden md:block border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Partner Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Bank Details</TableHead>
                    <TableHead>Acc. Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((aff) => (
                    <TableRow key={aff.id}>
                      <TableCell className="font-mono text-xs font-bold text-muted-foreground">{aff.id}</TableCell>
                      <TableCell>
                        <div className="font-semibold">{aff.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Joined {aff.joined}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" /> {aff.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{aff.bank}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-[#2870A3]">{aff.balance}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={aff.status === 'Active' ? 'default' : (aff.status === 'Pending' ? 'secondary' : 'outline')} className={aff.status === 'Active' ? 'bg-green-500' : ''}>
                          {aff.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-[#A37EDC] hover:text-[#8e69c4] hover:bg-[#f3effb]">
                          <ShieldCheck className="mr-2 h-4 w-4" /> Review
                        </Button>
                      </TableCell>
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

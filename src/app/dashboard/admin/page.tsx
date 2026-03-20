
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Users, ShoppingBag, Wallet, Activity, ArrowUpRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

export default function AdminDashboard() {
  const stats = [
    { title: "Total Revenue", value: "$24,580.00", icon: Wallet, color: "text-[#2870A3]", change: "+12.5%" },
    { title: "Total Sales", value: "1,248", icon: ShoppingBag, color: "text-[#A37EDC]", change: "+18.2%" },
    { title: "Active Affiliates", value: "342", icon: Users, color: "text-blue-500", change: "+4.1%" },
    { title: "Conversion Rate", value: "3.2%", icon: Activity, color: "text-green-500", change: "+0.8%" },
  ]

  const chartData = [
    { month: "Jan", sales: 1200 },
    { month: "Feb", sales: 1900 },
    { month: "Mar", sales: 1500 },
    { month: "Apr", sales: 2200 },
    { month: "May", sales: 2800 },
    { month: "Jun", sales: 2400 },
  ]

  const chartConfig = {
    sales: {
      label: "Monthly Sales",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  return (
    <DashboardShell role="admin">
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary mb-2">Network Overview</h1>
            <p className="text-muted-foreground">Monitoring NicaAffiliate Connect performance.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                    {stat.change} <ArrowUpRight className="h-3 w-3" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold font-headline mt-1">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Sales Growth</CardTitle>
              <CardDescription>Monthly conversion volume across the network.</CardDescription>
            </CardHeader>
            <CardContent>
               <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                  </BarChart>
               </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Recent Affiliates</CardTitle>
              <CardDescription>Latest registrations needing review.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Maria L.", bank: "Banpro", date: "2 mins ago" },
                  { name: "Roberto C.", bank: "BAC", date: "45 mins ago" },
                  { name: "Sonia G.", bank: "Lafise", date: "3 hours ago" },
                  { name: "Oscar P.", bank: "BDF", date: "5 hours ago" },
                ].map((aff) => (
                  <div key={aff.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#A37EDC]/20 text-[#A37EDC] flex items-center justify-center font-bold text-xs">
                        {aff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{aff.name}</p>
                        <p className="text-xs text-muted-foreground">{aff.bank}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{aff.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

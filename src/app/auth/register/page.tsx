"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NICA_BANKS } from '@/lib/constants'
import { Target, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Registration successful",
        description: `Welcome to ${t.brand}!`,
      })
      router.push('/dashboard/affiliate')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[#EFF2F4] flex flex-col justify-center items-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <Card className="w-full max-w-2xl shadow-xl border-none">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
              <Target className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-headline font-bold text-[#2870A3]">Become an Affiliate</CardTitle>
          <CardDescription>
            Join our network and start earning commissions today with {t.brand}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="Juan" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Perez" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Email (Gmail preferred)</Label>
                <Input id="email" type="email" placeholder="juan.perez@gmail.com" required />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Bank Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank">Bank Name</Label>
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {NICA_BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank.toLowerCase()}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accNumber">Account Number</Label>
                  <Input id="accNumber" placeholder="1234567890" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="accHolder">Account Holder Name</Label>
                  <Input id="accHolder" placeholder="Juan Alberto Perez Lopez" required />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#2870A3] hover:bg-[#1e5a82] font-semibold text-lg py-6 shadow-lg transition-all" disabled={loading}>
              {loading ? "Creating Account..." : "Create My Account"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t py-4">
          <p className="text-sm text-muted-foreground">
            Already have an account? <Link href="/dashboard/affiliate" className="text-primary font-semibold hover:underline">Log in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

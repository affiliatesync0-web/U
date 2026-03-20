
"use client"

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, ArrowRight, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/components/language-context';
import { LanguageToggle } from '@/components/language-toggle';
import placeholderData from '@/app/lib/placeholder-images.json';

export default function Home() {
  const { t } = useLanguage();
  const heroImage = placeholderData.placeholderImages.find(img => img.id === 'hero-business');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <Target className="h-6 w-6 text-primary" />
          <span className="font-headline font-bold text-lg md:text-xl text-primary">{t.brand}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 sm:gap-6">
          <Link className="hidden sm:inline-block text-sm font-medium hover:text-primary transition-colors" href="/auth/register">
            {t.joinAffiliate}
          </Link>
          <Link className="text-xs sm:text-sm font-medium hover:text-primary transition-colors" href="/auth/admin-login">
            {t.adminLogin}
          </Link>
          <LanguageToggle />
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-[#EFF2F4]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
              <div className="flex flex-col justify-center space-y-4 text-center lg:text-left">
                <div className="space-y-2">
                  <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-[#2870A3]">
                    {t.heroTitle}
                  </h1>
                  <p className="max-w-[600px] mx-auto lg:mx-0 text-muted-foreground md:text-xl font-body">
                    {t.heroSubtitle}
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-[400px]:flex-row justify-center lg:justify-start">
                  <Button asChild size="lg" className="bg-[#2870A3] hover:bg-[#1e5a82] font-semibold text-white px-8">
                    <Link href="/auth/register">
                      {t.getStarted} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-[#A37EDC] text-[#A37EDC] hover:bg-[#f3effb] px-8">
                    <Link href="/dashboard/affiliate">
                      {t.affiliatePortal}
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-2xl shadow-2xl border-4 border-white hidden md:block">
                 <Image 
                   src={heroImage?.imageUrl || "https://picsum.photos/seed/nica1/1200/800"}
                   alt={heroImage?.description || "AffiliateSync Dashboard"}
                   fill
                   className="object-cover"
                   data-ai-hint={heroImage?.imageHint || "business success"}
                 />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-4xl md:text-5xl text-[#2870A3]">Built for Growth</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-lg lg:text-base xl:text-xl font-body">
                  Everything you need to succeed as an affiliate or manage your own product line.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center p-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3effb]">
                  <ShieldCheck className="h-8 w-8 text-[#A37EDC]" />
                </div>
                <h3 className="text-xl font-bold font-headline">{t.securePayments}</h3>
                <p className="text-sm text-muted-foreground font-body">
                  Direct transfers to your bank account. Fast, reliable, and secure.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3effb]">
                  <BarChart3 className="h-8 w-8 text-[#A37EDC]" />
                </div>
                <h3 className="text-xl font-bold font-headline">{t.realTimeAnalytics}</h3>
                <p className="text-sm text-muted-foreground font-body">
                  Track every click and conversion with our advanced tracking system.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-4 sm:col-span-2 lg:col-span-1">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3effb]">
                  <Zap className="h-8 w-8 text-[#A37EDC]" />
                </div>
                <h3 className="text-xl font-bold font-headline">{t.premiumProducts}</h3>
                <p className="text-sm text-muted-foreground font-body">
                  Exclusive access to high-demand digital courses, services, and software.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-4 sm:flex-row py-8 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-muted-foreground">© 2024 AffiliateSync. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

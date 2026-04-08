
"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  GraduationCap, 
  PlayCircle, 
  Loader2, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck,
  Video,
  FileVideo,
  ChevronRight,
  Flame,
  ArrowRight
} from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export default function AffiliateAcademyPage() {
  const { t } = useLanguage();
  const db = useFirestore();
  
  const academyQuery = useMemoFirebase(() => collection(db, 'academy_lessons'), [db]);
  const { data: lessons, isLoading } = useCollection(academyQuery);

  const courseUrl = "https://syncacademy.systeme.io/school/course/syncacademy";

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-12">
        {/* Banner de Bienvenida y Acceso Externo */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-slate-900 p-10 md:p-14 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
            <GraduationCap className="h-64 w-64" />
          </div>
          
          <div className="relative z-10 space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20 flex items-center gap-2">
                <Flame className="h-3 w-3 fill-current animate-pulse" /> ENTRENAMIENTO ELITE
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight leading-none uppercase italic">
              Sync <span className="text-primary">Academy</span>
            </h1>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              Aprende las estrategias de marketing digital que están dominando el mercado en Nicaragua y escala tus comisiones.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Button asChild className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105">
                <a href={courseUrl} target="_blank" rel="noopener noreferrer">
                  ENTRAR AL CURSO OFICIAL <ExternalLink className="ml-3 h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline" className="h-16 px-10 rounded-2xl border-white/10 text-white hover:bg-white/5 font-black text-xs uppercase tracking-widest transition-all">
                <a href="#lessons">VER LECCIONES LOCALES</a>
              </Button>
            </div>
          </div>
        </div>

        <div id="lessons" className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-headline font-black text-slate-900 tracking-tight uppercase">Módulos de Soporte</h2>
              <p className="text-slate-500 font-medium text-sm">Entrenamientos rápidos y material estratégico adicional.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
            </div>
          ) : !lessons || lessons.length === 0 ? (
            <Card className="border-dashed border-4 flex flex-col items-center justify-center p-32 text-center bg-white/50 rounded-[4rem] border-slate-100">
              <PlayCircle className="h-20 w-20 text-slate-100 mb-6" />
              <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Próximamente nuevas lecciones</h3>
              <p className="text-slate-400 font-medium max-w-xs mt-2">Estamos preparando material exclusivo para potenciar tus ventas.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {lessons.sort((a, b) => (a.order || 0) - (b.order || 0)).map((lesson, i) => (
                <Card key={lesson.id} className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden group hover:-translate-y-2 transition-all duration-500 ring-1 ring-slate-100">
                  <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <PlayCircle className="h-16 w-16 text-white/20 group-hover:text-primary group-hover:scale-110 transition-all z-20" />
                    <div className="absolute top-6 left-6 z-20">
                      <Badge className="bg-primary border-none text-white font-black px-4 py-1.5 rounded-full text-[9px] uppercase tracking-widest shadow-xl">
                        MÓDULO {lesson.order || (i + 1)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-8 space-y-4">
                    <h3 className="text-xl font-headline font-black text-slate-900 uppercase tracking-tight leading-tight line-clamp-2 min-h-[3.5rem]">
                      {lesson.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 line-clamp-3 leading-relaxed">
                      {lesson.description || "Sin descripción disponible."}
                    </p>
                    <div className="pt-4">
                      <AcademyVideoPlayer lesson={lesson} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sección de Soporte */}
        <div className="p-10 bg-blue-50 rounded-[3.5rem] border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-blue-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-blue-200 -rotate-3">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-2xl font-headline font-black text-blue-900 tracking-tight">¿Necesitas ayuda con el curso?</h3>
              <p className="text-blue-700 font-medium">Nuestro equipo de soporte está disponible para guiarte en tu formación.</p>
            </div>
          </div>
          <Button variant="outline" className="h-14 px-10 rounded-2xl border-blue-200 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
            CONTACTAR SOPORTE
          </Button>
        </div>
      </div>
    </DashboardShell>
  )
}

function AcademyVideoPlayer({ lesson }: { lesson: any }) {
  const isFirebaseStorage = lesson.videoUrl?.includes('firebasestorage.googleapis.com');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-primary transition-all">
          <PlayCircle className="mr-2 h-4 w-4" /> VER CLASE AHORA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-black">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
              <Video className="h-4 w-4" />
            </div>
            <DialogTitle className="text-sm font-headline font-black uppercase tracking-tight">{lesson.title}</DialogTitle>
          </div>
        </div>
        <div className="aspect-video w-full bg-black flex items-center justify-center">
          {isFirebaseStorage ? (
            <video 
              src={lesson.videoUrl} 
              controls 
              className="w-full h-full" 
              autoPlay 
              playsInline
            />
          ) : (
            <iframe 
              src={lesson.videoUrl} 
              className="w-full h-full" 
              allowFullScreen 
              allow="autoplay; fullscreen; picture-in-picture"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

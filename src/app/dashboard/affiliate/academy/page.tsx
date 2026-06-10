"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  PlayCircle, 
  Video, 
  Loader2, 
  GraduationCap, 
  ChevronRight,
  ShieldCheck,
  Clock
} from 'lucide-react'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import { cn } from '@/lib/utils'

export default function AffiliateAcademyPage() {
  const db = useFirestore()
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  
  const academyQuery = useMemoFirebase(() => collection(db, 'academy_lessons'), [db]);
  const { data: lessons, isLoading } = useCollection(academyQuery);

  const activeLesson = selectedLesson || (lessons && lessons.length > 0 ? lessons[0] : null);

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  };

  return (
    <DashboardShell role="affiliate">
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-lg">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-headline font-black text-slate-900 tracking-tight uppercase">Sync <span className="text-slate-500">Academy</span></h1>
            <p className="text-slate-500 text-sm font-medium">Entrenamiento oficial en Marketing Digital de alto rendimiento.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-40"><Loader2 className="animate-spin text-slate-300" /></div>
        ) : !lessons || lessons.length === 0 ? (
          <Card className="p-32 text-center border-dashed border-2 border-slate-200 bg-white rounded-xl">
             <Video className="h-12 w-12 text-slate-200 mx-auto mb-4" />
             <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Contenido próximamente disponible</h3>
             <p className="text-slate-400 text-sm mt-2">Estamos preparando las mejores estrategias para tu crecimiento.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* REPRODUCTOR PRINCIPAL */}
            <div className="lg:col-span-8 space-y-6">
              <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-black aspect-video relative">
                {activeLesson ? (
                  <iframe 
                    src={getEmbedUrl(activeLesson.videoUrl)} 
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/20">
                    <PlayCircle className="h-20 w-20" />
                  </div>
                )}
              </Card>
              
              {activeLesson && (
                <div className="space-y-4 px-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight italic">{activeLesson.title}</h2>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                       <Clock className="h-3.5 w-3.5" /> Publicado: {new Date(activeLesson.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="p-6 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                      {activeLesson.description || 'Sin descripción detallada.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-slate-900 text-white rounded-lg w-fit">
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Contenido Exclusivo Platinum</span>
                  </div>
                </div>
              )}
            </div>

            {/* LISTA DE LECCIONES */}
            <Card className="lg:col-span-4 border-none shadow-xl rounded-2xl bg-white overflow-hidden h-[600px] flex flex-col ring-1 ring-slate-100">
              <CardHeader className="bg-slate-50 border-b p-6">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Plan de Estudios</CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-1">
                  {lessons.sort((a, b) => (a.order || 0) - (b.order || 0)).map((lesson, idx) => (
                    <button 
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl flex items-center gap-4 transition-all group",
                        activeLesson?.id === lesson.id ? "bg-slate-900 text-white shadow-lg" : "hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors",
                        activeLesson?.id === lesson.id ? "bg-white/10 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-white"
                      )}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[11px] font-black uppercase truncate", activeLesson?.id === lesson.id ? "text-white" : "text-slate-700")}>{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <PlayCircle className={cn("h-3 w-3", activeLesson?.id === lesson.id ? "text-slate-400" : "text-slate-300")} />
                           <span className={cn("text-[8px] font-bold uppercase tracking-widest", activeLesson?.id === lesson.id ? "text-slate-500" : "text-slate-400")}>Ver sesión</span>
                        </div>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1", activeLesson?.id === lesson.id ? "text-white" : "text-slate-200")} />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

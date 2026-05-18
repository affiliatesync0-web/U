"use client"

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { 
  MapPin, 
  Loader2, 
  ExternalLink, 
  Users, 
  Calendar, 
  Navigation, 
  ShieldCheck,
  Search,
  Activity
} from 'lucide-react'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'

export default function AdminMapPage() {
  const db = useFirestore()
  const [searchTerm, setSearchBuyer] = useState('')

  const affiliatesQuery = useMemoFirebase(() => collection(db, 'affiliates'), [db])
  const { data: affiliates, isLoading } = useCollection(affiliatesQuery)

  // Filtrar solo los que tienen ubicación
  const locatedAffiliates = affiliates?.filter(a => a.lastLocation) || []
  
  const filteredList = locatedAffiliates.filter(a => 
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardShell role="admin">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <MapPin className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Geolocalización Estratégica</span>
            </div>
            <h1 className="text-4xl font-headline font-black text-slate-900 tracking-tight leading-none uppercase italic">Mapa de <span className="text-primary">Red Sync</span></h1>
            <p className="text-slate-500 font-medium max-w-xl">Rastrea la ubicación de tus socios activos en tiempo real para analizar el alcance de tu marca.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
            <Input 
              className="pl-14 h-16 rounded-[1.5rem] border-none bg-white shadow-xl text-sm font-bold" 
              placeholder="Buscar socio localizado..." 
              value={searchTerm}
              onChange={(e) => setSearchBuyer(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          </div>
        ) : locatedAffiliates.length === 0 ? (
          <Card className="border-dashed border-4 flex flex-col items-center justify-center p-32 text-center bg-white/50 rounded-[4rem] border-slate-100">
            <Navigation className="h-20 w-20 text-slate-200 mb-8 animate-pulse" />
            <h3 className="text-2xl font-black text-slate-400 mb-2">Sin datos de ubicación</h3>
            <p className="text-slate-400 max-w-sm font-bold text-sm leading-relaxed">Los afiliados deben estar activos y haber aceptado el permiso de ubicación.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredList.map((aff) => (
              <Card key={aff.id} className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden group hover:scale-[1.02] transition-all ring-1 ring-slate-100">
                <div className="p-8 bg-slate-900 text-white relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity className="h-20 w-20 text-primary animate-pulse" />
                  </div>
                  <div className="relative z-10 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black shadow-lg">
                      {aff.firstName?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-lg uppercase tracking-tight truncate max-w-[180px]">{aff.firstName} {aff.lastName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
                        <span className="text-[8px] font-black uppercase text-green-400 tracking-widest">Tracking Live</span>
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border">
                      <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400">
                        <Navigation className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coordenadas Actuales</p>
                        <p className="text-[11px] font-bold text-slate-700 font-mono">{aff.lastLocation.lat.toFixed(6)}, {aff.lastLocation.lng.toFixed(6)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border">
                      <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Último Reporte Sync</p>
                        <p className="text-[11px] font-bold text-slate-700">{new Date(aff.lastLocation.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <Button asChild className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-xl group-hover:bg-primary transition-all gap-2">
                    <a href={`https://www.google.com/maps?q=${aff.lastLocation.lat},${aff.lastLocation.lng}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" /> ABRIR EN GOOGLE MAPS
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

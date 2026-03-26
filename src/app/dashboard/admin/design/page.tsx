
"use client"

import { useState, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Image as ImageIcon, Save, RefreshCw, Wand2, Loader2, Star, Upload, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { doc, collection } from 'firebase/firestore'
import { getGoogleDriveDirectLink, cn } from '@/lib/utils'

export default function AdminDesignPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const db = useFirestore()
  const { user, isUserLoading } = useUser();
  const [savingId, setSavingId] = useState<string | null>(null)

  const configQuery = useMemoFirebase(() => {
    if (!db || isUserLoading || !user) return null;
    return collection(db, 'site_config');
  }, [db, user, isUserLoading]);
  const { data: overrides, isLoading } = useCollection(configQuery);

  const images = placeholderData.placeholderImages || [];

  const handleSave = (imgId: string, url: string, hint: string) => {
    const configRef = doc(db, 'site_config', imgId);
    setSavingId(imgId);
    
    setDocumentNonBlocking(configRef, {
      id: imgId,
      imageUrl: (url || "").trim(),
      imageHint: (hint || "").trim(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    setTimeout(() => {
      setSavingId(null);
      toast({
        title: t.saveChanges,
        description: "La configuración de imagen se ha actualizado correctamente.",
      });
    }, 1000);
  };

  if (isUserLoading || isLoading) {
    return (
      <DashboardShell role="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="admin">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary mb-2">{t.design}</h1>
          <p className="text-muted-foreground">Personaliza las imágenes clave y la identidad de Sync Connect.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {images.map((img) => {
            const override = overrides?.find(o => o.id === img.id);
            const currentUrl = (override?.imageUrl || img.imageUrl || "").trim();
            const currentHint = (override?.imageHint || img.imageHint || "").trim();

            return (
              <ImageEditorCard 
                key={img.id}
                id={img.id}
                description={img.description}
                defaultUrl={currentUrl}
                defaultHint={currentHint}
                onSave={handleSave}
                isSaving={savingId === img.id}
                t={t}
              />
            );
          })}
        </div>
      </div>
    </DashboardShell>
  )
}

function ImageEditorCard({ id, description, defaultUrl, defaultHint, onSave, isSaving, t }: any) {
  const [url, setUrl] = useState(defaultUrl);
  const [hint, setHint] = useState(defaultHint);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLogo = id === 'site-logo';
  const displayUrl = getGoogleDriveDirectLink(url);
  const hasValidUrl = displayUrl && displayUrl.trim().length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // Limit to ~800KB for Firestore documents
        alert("La imagen es demasiado grande. Por favor sube una imagen de menos de 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className={cn("border-none shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md", isLogo && "ring-2 ring-primary/20")}>
      <div className={cn("relative h-48 w-full bg-slate-100 flex items-center justify-center overflow-hidden", isLogo && "p-8")}>
        {hasValidUrl ? (
          <Image 
            src={displayUrl} 
            alt={description} 
            fill={!isLogo}
            width={isLogo ? 180 : undefined}
            height={isLogo ? 180 : undefined}
            className={cn("transition-transform duration-500 hover:scale-105", isLogo ? "object-contain" : "object-cover")}
            unoptimized={true}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground opacity-30">
            <ImageIcon className="h-12 w-12 mb-2" />
            <span className="text-xs font-bold uppercase tracking-widest">Sin Imagen</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity gap-2">
           <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="font-bold">
             <Upload className="h-4 w-4 mr-2" /> {t.updateImage}
           </Button>
           {hasValidUrl && (
             <Button variant="destructive" size="sm" onClick={() => setUrl("")} className="font-bold">
               <Trash2 className="h-4 w-4" />
             </Button>
           )}
        </div>
        {isLogo && (
          <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <Star className="h-2 w-2" /> Marca Principal
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="text-lg font-headline flex items-center gap-2">
          {description}
          {isLogo && <span className="text-primary font-bold">(LOGO)</span>}
        </CardTitle>
        <CardDescription className="font-mono text-[10px] uppercase">ID: {id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        <div className="space-y-2">
          <Label className="text-xs font-bold">{t.imageUrl}</Label>
          <div className="flex gap-2">
            <Input 
              value={url.startsWith('data:') ? 'Imagen subida localmente' : url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="URL de la imagen o sube un archivo"
              className="text-xs bg-slate-50 flex-1"
              disabled={url.startsWith('data:')}
            />
            <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} title="Subir archivo">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          {url.startsWith('data:') && (
            <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
              <Star className="h-2 w-2" /> Imagen cargada desde tu dispositivo
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs font-bold flex items-center gap-2">
            <Wand2 className="h-3 w-3 text-primary" /> {t.imageHint}
          </Label>
          <Input 
            value={hint} 
            onChange={(e) => setHint(e.target.value)} 
            placeholder="marketing analysis"
            className="text-xs bg-slate-50"
          />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 bg-muted/20">
        <Button 
          onClick={() => onSave(id, url, hint)} 
          className="w-full bg-primary font-bold shadow-lg h-11"
          disabled={isSaving}
        >
          {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t.saveChanges}
        </Button>
      </CardFooter>
    </Card>
  )
}

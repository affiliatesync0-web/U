
"use client"

import { useState } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Image as ImageIcon, Save, RefreshCw, Wand2, Loader2, Star } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { doc, collection } from 'firebase/firestore'

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
      imageUrl: url,
      imageHint: hint,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    setTimeout(() => {
      setSavingId(null);
      toast({
        title: t.saveChanges,
        description: "La configuración de imagen se ha actualizado en la base de datos y se reflejará en todo el sitio.",
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
            const currentUrl = override?.imageUrl || img.imageUrl || "";
            const currentHint = override?.imageHint || img.imageHint || "";

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

  const isLogo = id === 'site-logo';

  return (
    <Card className={`border-none shadow-sm overflow-hidden flex flex-col ${isLogo ? 'ring-2 ring-primary/20' : ''}`}>
      <div className={`relative h-48 w-full bg-muted ${isLogo ? 'flex items-center justify-center' : ''}`}>
        {url ? (
          <Image 
            src={url} 
            alt={description} 
            fill={!isLogo}
            width={isLogo ? 160 : undefined}
            height={isLogo ? 160 : undefined}
            className={isLogo ? 'object-contain h-32 w-32' : 'object-cover'}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <ImageIcon className="h-12 w-12 opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
           <ImageIcon className="text-white h-10 w-10" />
        </div>
        {isLogo && (
          <div className="absolute top-4 right-4 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
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
        <div className="space-y-2">
          <Label className="text-xs font-bold">{t.imageUrl}</Label>
          <Input 
            value={url} 
            onChange={(e) => setUrl(e.target.value)} 
            placeholder="https://images.unsplash.com/..."
            className="text-xs bg-slate-50"
          />
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
          className="w-full bg-primary font-bold shadow-lg"
          disabled={isSaving}
        >
          {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t.saveChanges}
        </Button>
      </CardFooter>
    </Card>
  )
}

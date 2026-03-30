"use client"

import { useState, useRef } from 'react'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Image as ImageIcon, Save, RefreshCw, Wand2, Loader2, Star, Upload, Trash2, Smartphone, Facebook, Instagram, Music2, Mail, ShieldCheck, Send, Info } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/components/language-context'
import placeholderData from '@/app/lib/placeholder-images.json'
import { useFirestore, setDocumentNonBlocking, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { doc, collection } from 'firebase/firestore'
import { getGoogleDriveDirectLink, cn } from '@/lib/utils'
import { testEmailConfig } from '@/lib/email'

export default function AdminDesignPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const db = useFirestore()
  const { user, isUserLoading } = useUser();
  const [savingId, setSavingId] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)

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
        description: "La configuración se ha actualizado correctamente.",
      });
    }, 1000);
  };

  const handleSaveValue = (id: string, value: string) => {
    const configRef = doc(db, 'site_config', id);
    setSavingId(id);
    
    setDocumentNonBlocking(configRef, {
      id: id,
      value: (value || "").trim(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    setTimeout(() => {
      setSavingId(null);
      toast({
        title: t.saveChanges,
        description: "Se ha actualizado el valor de configuración.",
      });
    }, 1000);
  };

  const handleTestEmail = async () => {
    const gmailUser = overrides?.find(o => o.id === 'gmail-user')?.value || 'affiliatesync0@gmail.com';
    setTestLoading(true);
    try {
      const result = await testEmailConfig(gmailUser);
      if (result.success) {
        toast({ title: "Correo Enviado", description: `Revisa la bandeja de entrada de ${gmailUser} para confirmar.` });
      } else {
        toast({ variant: "destructive", title: "Error en la prueba", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error de conexión", description: "No se pudo contactar con el servidor de correos." });
    } finally {
      setTestLoading(false);
    }
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

  const getVal = (id: string) => {
    const found = overrides?.find(o => o.id === id)?.value;
    if (found) return found;
    // Valores predeterminados si no están en DB
    if (id === 'gmail-user') return 'affiliatesync0@gmail.com';
    if (id === 'gmail-pass') return 'wagrmuphptnevpin';
    return "";
  };

  return (
    <DashboardShell role="admin">
      <div className="space-y-12">
        <div>
          <h1 className="text-4xl font-headline font-black text-primary mb-2">Identidad & Configuración</h1>
          <p className="text-muted-foreground">Personaliza la imagen de marca, medios de contacto y servicios de Sync Connect.</p>
        </div>

        {/* CONFIGURACIÓN DE GMAIL */}
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
          <CardHeader className="bg-slate-900 text-white p-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-headline font-black text-white">{t.emailConfig}</CardTitle>
                  <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Configuración actual: affiliatesync0@gmail.com</CardDescription>
                </div>
              </div>
              <Button 
                onClick={handleTestEmail} 
                variant="outline" 
                disabled={testLoading}
                className="bg-white/5 border-white/10 text-white hover:bg-primary hover:border-primary font-black text-[10px] uppercase tracking-widest h-12 rounded-xl"
              >
                {testLoading ? <RefreshCw className="animate-spin h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Probar Conexión
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.gmailUser}</Label>
                <Input 
                  placeholder="tu-correo@gmail.com" 
                  defaultValue={getVal('gmail-user')}
                  onBlur={(e) => handleSaveValue('gmail-user', e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all px-6 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.gmailPass}</Label>
                <Input 
                  type="password"
                  placeholder="•••• •••• •••• ••••" 
                  defaultValue={getVal('gmail-pass')}
                  onBlur={(e) => handleSaveValue('gmail-pass', e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all px-6 font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                 <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0" />
                 <div className="space-y-1">
                   <p className="text-xs text-amber-800 leading-relaxed font-bold">
                     {t.emailHelp}
                   </p>
                   <p className="text-[10px] text-amber-700 leading-relaxed">
                     Para bienvenida y ventas, usamos SMTP. Para <strong>Recuperación de Contraseña</strong>, Firebase requiere configuración manual.
                   </p>
                 </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                 <Info className="h-6 w-6 text-blue-600 shrink-0" />
                 <div className="space-y-2">
                   <p className="text-xs text-blue-800 leading-relaxed font-bold">
                     Configuración de Recuperación de Contraseña
                   </p>
                   <p className="text-[10px] text-blue-700 leading-relaxed">
                     Para que los correos de "Olvidé mi contraseña" salgan desde <strong>affiliatesync0@gmail.com</strong>, debes ir a tu consola de Firebase:
                   </p>
                   <ol className="text-[10px] text-blue-700 list-decimal ml-4 space-y-1">
                     <li>Ve a <strong>Authentication</strong> → <strong>Templates</strong>.</li>
                     <li>Selecciona <strong>Password Reset</strong>.</li>
                     <li>Haz clic en el icono de lápiz y luego en <strong>"Configure SMTP server"</strong>.</li>
                     <li>Usa el servidor: <code>smtp.gmail.com</code>, puerto <code>465</code>, y tus credenciales de aplicación.</li>
                   </ol>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* REDES SOCIALES Y WHATSAPP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden ring-1 ring-slate-100">
            <CardHeader className="bg-slate-50/50 p-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 shadow-inner">
                  <Smartphone className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-headline font-black text-slate-900">{t.whatsappConfig}</CardTitle>
              </div>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Número oficial para soporte y consultas</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">{t.whatsappNumberLabel}</Label>
                <Input 
                  placeholder="50588888888" 
                  defaultValue={getVal('site-whatsapp')}
                  onBlur={(e) => handleSaveValue('site-whatsapp', e.target.value)}
                  className="h-16 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-4 focus:ring-primary/10 transition-all px-6 text-lg font-mono font-bold"
                />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1 italic">Este número se usará para el botón flotante en la web.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden">
            <CardHeader className="p-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-xl">
                  <Star className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-headline font-black text-white">{t.socialLinks}</CardTitle>
              </div>
              <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Enlaces a tus perfiles oficiales</CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2"><Facebook className="h-3 w-3" /> {t.facebook}</Label>
                  <Input 
                    placeholder="https://facebook.com/tu-pagina" 
                    defaultValue={getVal('social-facebook')}
                    onBlur={(e) => handleSaveValue('social-facebook', e.target.value)}
                    className="h-12 rounded-xl bg-white/5 border-none ring-1 ring-white/10 focus:ring-2 focus:ring-primary transition-all px-4 text-xs font-medium text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2"><Instagram className="h-3 w-3" /> {t.instagram}</Label>
                  <Input 
                    placeholder="https://instagram.com/tu-perfil" 
                    defaultValue={getVal('social-instagram')}
                    onBlur={(e) => handleSaveValue('social-instagram', e.target.value)}
                    className="h-12 rounded-xl bg-white/5 border-none ring-1 ring-white/10 focus:ring-2 focus:ring-primary transition-all px-4 text-xs font-medium text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-2"><Music2 className="h-3 w-3" /> {t.tiktok}</Label>
                  <Input 
                    placeholder="https://tiktok.com/@tu-cuenta" 
                    defaultValue={getVal('social-tiktok')}
                    onBlur={(e) => handleSaveValue('social-tiktok', e.target.value)}
                    className="h-12 rounded-xl bg-white/5 border-none ring-1 ring-white/10 focus:ring-2 focus:ring-primary transition-all px-4 text-xs font-medium text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* IMÁGENES DEL SITIO */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-primary rounded-full" />
            <h2 className="text-2xl font-headline font-black text-slate-900 tracking-tight">Galería de Medios</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      if (file.size > 800000) {
        alert("La imagen es demasiado grande. Máximo 800KB.");
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
    <Card className={cn("border-none shadow-xl rounded-[2.5rem] overflow-hidden flex flex-col transition-all hover:shadow-2xl group bg-white ring-1 ring-slate-100", isLogo && "ring-2 ring-primary/20")}>
      <div className={cn("relative h-56 w-full bg-slate-50 flex items-center justify-center overflow-hidden", isLogo && "p-10")}>
        {hasValidUrl ? (
          <Image 
            src={displayUrl} 
            alt={description} 
            fill={!isLogo}
            width={isLogo ? 180 : undefined}
            height={isLogo ? 180 : undefined}
            className={cn("transition-transform duration-1000 group-hover:scale-110", isLogo ? "object-contain" : "object-cover")}
            unoptimized={true}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-300">
            <ImageIcon className="h-16 w-16 mb-2 opacity-20" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sin Multimedia</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 gap-3 backdrop-blur-sm">
           <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="font-black text-[10px] uppercase tracking-widest rounded-xl h-12 px-6">
             <Upload className="h-4 w-4 mr-2" /> {t.updateImage}
           </Button>
           {hasValidUrl && (
             <Button variant="destructive" size="icon" onClick={() => setUrl("")} className="h-12 w-12 rounded-xl">
               <Trash2 className="h-5 w-5" />
             </Button>
           )}
        </div>
        {isLogo && (
          <div className="absolute top-6 right-6 bg-primary text-white text-[9px] font-black px-4 py-1.5 rounded-full flex items-center gap-2 shadow-2xl uppercase tracking-widest">
            <Star className="h-3 w-3 fill-white" /> Branding
          </div>
        )}
      </div>
      <CardHeader className="px-8 pt-8 pb-4">
        <CardTitle className="text-lg font-headline font-black text-slate-900 group-hover:text-primary transition-colors">
          {description}
        </CardTitle>
        <CardDescription className="font-mono text-[9px] uppercase font-bold text-slate-400">ID: {id}</CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8 space-y-6 flex-1">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{t.imageUrl}</Label>
          <div className="flex gap-2">
            <Input 
              value={url.startsWith('data:') ? 'Imagen cargada localmente' : url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="URL o sube un archivo"
              className="text-xs bg-slate-50 border-none ring-1 ring-slate-100 rounded-xl h-12 font-medium"
              disabled={url.startsWith('data:')}
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
            <Wand2 className="h-3 w-3 text-primary" /> {t.imageHint}
          </Label>
          <Input 
            value={hint} 
            onChange={(e) => setHint(e.target.value)} 
            placeholder="Ej: marketing professional"
            className="text-xs bg-slate-50 border-none ring-1 ring-slate-100 rounded-xl h-12 font-medium"
          />
        </div>
      </CardContent>
      <CardFooter className="px-8 pb-8">
        <Button 
          onClick={() => onSave(id, url, hint)} 
          className="w-full bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl h-14 shadow-xl shadow-primary/20"
          disabled={isSaving}
        >
          {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {t.saveChanges}
        </Button>
      </CardFooter>
    </Card>
  )
}

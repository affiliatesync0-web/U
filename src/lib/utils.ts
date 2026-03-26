import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Transforma un enlace de Google Drive en un enlace de imagen directa (thumbnail).
 * Soporta formatos: /file/d/ID/view, /open?id=ID, /uc?id=ID
 */
export function getGoogleDriveDirectLink(url: string | null | undefined): string {
  if (!url || !url.includes('drive.google.com')) return url || "";

  try {
    let fileId = "";
    
    // Caso 1: /file/d/[ID]/view
    if (url.includes('/file/d/')) {
      fileId = url.split('/file/d/')[1].split('/')[0];
    } 
    // Caso 2: ?id=[ID] o &id=[ID]
    else if (url.includes('id=')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      fileId = urlParams.get('id') || "";
    }

    if (fileId) {
      // Usamos el endpoint de thumbnail con tamaño máximo para mejor calidad
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
  } catch (e) {
    console.warn("Error transformando URL de Google Drive:", e);
  }

  return url;
}

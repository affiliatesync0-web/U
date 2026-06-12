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
  if (!url) return "";
  if (!url.includes('drive.google.com')) return url;

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
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
  } catch (e) {
    console.warn("Error transformando URL de Google Drive:", e);
  }

  return url;
}

/**
 * Extrae el ID de video de una URL de YouTube.
 */
export function getYoutubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Obtiene la miniatura de un video de YouTube.
 */
export function getYoutubeThumbnail(url: string): string {
  const id = getYoutubeId(url);
  if (!id) return "https://picsum.photos/seed/video/600/400";
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

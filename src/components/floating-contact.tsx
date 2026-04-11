"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase'
import { collection } from 'firebase/firestore'

/**
 * Componente de botón flotante para contacto rápido por WhatsApp.
 * Ahora se oculta automáticamente si el usuario ha iniciado sesión.
 * Es movible (arrastrable) y persiste su posición en el navegador.
 */
export function FloatingContact() {
  const db = useFirestore();
  const { user } = useUser();
  const configQuery = useMemoFirebase(() => collection(db, 'site_config'), [db]);
  const { data: configs } = useCollection(configQuery);

  // Posición controlada (inicializada null para evitar errores de hidratación)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 });

  const whatsappConfig = configs?.find(c => c.id === 'site-whatsapp');
  const phoneNumber = whatsappConfig?.value || "";

  useEffect(() => {
    // Intentar recuperar posición guardada
    const savedPos = localStorage.getItem('whatsapp-btn-pos');
    if (savedPos) {
      try {
        const parsed = JSON.parse(savedPos);
        // Validar que la posición esté dentro de la pantalla actual
        if (parsed.x < window.innerWidth && parsed.y < window.innerHeight) {
          setPosition(parsed);
          return;
        }
      } catch (e) {
        console.warn("Error cargando posición de botón");
      }
    }
    
    // Posición inicial por defecto: Abajo a la derecha
    setPosition({
      x: window.innerWidth - 84,
      y: window.innerHeight - 100
    });
  }, []);

  const onStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!position) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setHasMoved(false);
    dragStart.current = {
      x: position.x,
      y: position.y,
      mouseX: clientX,
      mouseY: clientY
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - dragStart.current.mouseX;
      const dy = clientY - dragStart.current.mouseY;

      // Si se mueve más de 5px, se considera arrastre y no clic
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        setHasMoved(true);
      }

      let newX = dragStart.current.x + dx;
      let newY = dragStart.current.y + dy;

      // Mantener dentro de los límites de la pantalla
      const margin = 10;
      newX = Math.max(margin, Math.min(window.innerWidth - 74, newX));
      newY = Math.max(margin, Math.min(window.innerHeight - 74, newY));

      const newPos = { x: newX, y: newY };
      setPosition(newPos);
      
      // Guardar posición para persistencia
      localStorage.setItem('whatsapp-btn-pos', JSON.stringify(newPos));
    };

    const onEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('touchend', onEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging]);

  // SI EL USUARIO ESTÁ LOGUEADO, NO MOSTRAR EL BOTÓN
  if (user) return null;

  if (!phoneNumber || !position) return null;

  const cleanNumber = phoneNumber.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${cleanNumber}`;

  return (
    <div
      onMouseDown={onStart}
      onTouchStart={onStart}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999,
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      className="animate-in fade-in zoom-in duration-500"
    >
      <a
        href={hasMoved ? undefined : whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (hasMoved) {
            e.preventDefault();
          }
        }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-[0_10px_40px_rgba(37,211,102,0.4)] transition-all hover:scale-110 active:scale-95 border-2 border-white/20"
        title="Arrastra para mover, clic para contactar"
      >
        <MessageCircle className="h-8 w-8 fill-current" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
        </span>
      </a>
    </div>
  );
}

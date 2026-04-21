
import { NextResponse } from 'next/server';

/**
 * Webhook desactivado. 
 * El sistema ahora se enfoca exclusivamente en el AI Site Builder y herramientas de cierre directo.
 */
export async function POST(req: Request) {
  return NextResponse.json({ status: 'Bot disabled by admin request' });
}

export async function GET(req: Request) {
  return new Response('Forbidden', { status: 403 });
}

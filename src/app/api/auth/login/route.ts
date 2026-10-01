import { NextResponse } from 'next/server'
import { loginClienteTienda, erpConfigured } from '@/lib/erp'

export async function POST(req: Request) {
  if (!erpConfigured()) {
    return NextResponse.json(
      { status: 'error', error: 'La tienda todavía no está conectada al ERP (faltan ERP_API_URL/ERP_API_TOKEN en el servidor).' },
      { status: 400 }
    )
  }

  const body = (await req.json().catch(() => null)) as { correo?: string; password?: string } | null
  if (!body?.correo || !body?.password) {
    return NextResponse.json({ status: 'error', error: 'correo y contraseña son obligatorios' }, { status: 400 })
  }

  try {
    const sesion = await loginClienteTienda(body.correo, body.password)
    return NextResponse.json({ status: 'success', ...sesion })
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Correo o contraseña incorrectos'
    return NextResponse.json({ status: 'error', error: mensaje }, { status: 401 })
  }
}

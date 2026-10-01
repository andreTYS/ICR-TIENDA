import { NextResponse } from 'next/server'
import { actualizarPerfilTienda, erpConfigured } from '@/lib/erp'

export async function POST(req: Request) {
  if (!erpConfigured()) {
    return NextResponse.json(
      { status: 'error', error: 'La tienda todavía no está conectada al ERP (faltan ERP_API_URL/ERP_API_TOKEN en el servidor).' },
      { status: 400 }
    )
  }

  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return NextResponse.json({ status: 'error', error: 'Falta la sesión del cliente' }, { status: 401 })
  }

  const body = (await req.json().catch(() => null)) as {
    nombre?: string
    telefono?: string
    empresa?: string
    ruc?: string
    dni?: string
  } | null
  if (!body?.nombre) {
    return NextResponse.json({ status: 'error', error: 'nombre es obligatorio' }, { status: 400 })
  }

  try {
    const sesion = await actualizarPerfilTienda(token, {
      nombre: body.nombre,
      telefono: body.telefono,
      empresa: body.empresa,
      ruc: body.ruc,
      dni: body.dni,
    })
    return NextResponse.json({ status: 'success', ...sesion })
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'No se pudo actualizar el perfil'
    return NextResponse.json({ status: 'error', error: mensaje }, { status: 400 })
  }
}

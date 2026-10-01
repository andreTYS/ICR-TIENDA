import { NextResponse } from 'next/server'
import { registrarClienteTienda, erpConfigured } from '@/lib/erp'

export async function POST(req: Request) {
  if (!erpConfigured()) {
    return NextResponse.json(
      { status: 'error', error: 'La tienda todavía no está conectada al ERP (faltan ERP_API_URL/ERP_API_TOKEN en el servidor).' },
      { status: 400 }
    )
  }

  const body = (await req.json().catch(() => null)) as {
    nombre?: string
    correo?: string
    password?: string
    telefono?: string
    empresa?: string
    ruc?: string
    dni?: string
  } | null
  if (!body?.nombre || !body?.correo || !body?.password) {
    return NextResponse.json({ status: 'error', error: 'nombre, correo y contraseña son obligatorios' }, { status: 400 })
  }

  try {
    const sesion = await registrarClienteTienda({ ...body, nombre: body.nombre, correo: body.correo, password: body.password })
    return NextResponse.json({ status: 'success', ...sesion })
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'No se pudo crear la cuenta'
    console.error('No se pudo registrar cliente de tienda:', err)
    return NextResponse.json({ status: 'error', error: mensaje }, { status: 400 })
  }
}

import { NextResponse } from 'next/server'
import { obtenerPedidosTienda, erpConfigured } from '@/lib/erp'

export async function GET(req: Request) {
  if (!erpConfigured()) {
    return NextResponse.json({ status: 'success', pedidos: [] })
  }

  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) {
    return NextResponse.json({ status: 'error', error: 'Falta la sesión del cliente' }, { status: 401 })
  }

  try {
    const data = await obtenerPedidosTienda(token)
    return NextResponse.json({ status: 'success', ...data })
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'No se pudo cargar el historial de pedidos'
    return NextResponse.json({ status: 'error', error: mensaje }, { status: 502 })
  }
}

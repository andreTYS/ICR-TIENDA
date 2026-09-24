import { NextResponse } from 'next/server'
import { crearLeadDesdeWeb, erpConfigured } from '@/lib/erp'

interface ItemSolicitado {
  sku: string
  nombre: string
  qty: number
}

interface CuerpoSolicitud {
  empresa?: string
  contacto?: string
  correo?: string
  ciudad?: string
  consumo?: string
  tipoCliente?: 'empresa' | 'hogar'
  items: ItemSolicitado[]
}

function construirNotas(b: CuerpoSolicitud): string {
  const lineas = [
    `Tipo de cliente: ${b.tipoCliente === 'hogar' ? 'Hogar' : 'Empresa'}`,
    b.ciudad ? `Ciudad del proyecto: ${b.ciudad}` : null,
    b.consumo ? `Consumo mensual estimado: ${b.consumo} kWh` : null,
    '',
    'Referencias solicitadas desde la tienda web:',
    ...(b.items || []).map((it) => `- ${it.qty} x ${it.nombre} (SKU ${it.sku})`),
  ].filter((l): l is string => l !== null)
  return lineas.join('\n')
}

export async function POST(req: Request) {
  if (!erpConfigured()) {
    return NextResponse.json(
      { status: 'error', error: 'La tienda todavía no está conectada al ERP (faltan ERP_API_URL/ERP_API_TOKEN en el servidor).' },
      { status: 400 }
    )
  }

  const body = (await req.json().catch(() => null)) as CuerpoSolicitud | null
  if (!body?.contacto) {
    return NextResponse.json({ status: 'error', error: 'contacto es obligatorio' }, { status: 400 })
  }

  try {
    const { codigo } = await crearLeadDesdeWeb({
      nombreContacto: body.contacto,
      empresa: body.empresa,
      email: body.correo,
      notas: construirNotas(body),
    })
    return NextResponse.json({ status: 'success', codigo })
  } catch (err) {
    console.error('No se pudo crear el lead en el ERP desde la tienda:', err)
    return NextResponse.json(
      { status: 'error', error: 'No se pudo enviar la solicitud. Intenta de nuevo en unos minutos.' },
      { status: 502 }
    )
  }
}

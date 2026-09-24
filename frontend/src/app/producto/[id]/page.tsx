'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { PRODUCTOS, money, productoPorId } from '@/data/products'
import { useQuote } from '@/context/QuoteContext'
import Container from '@/components/Container'

const GARANTIAS = [
  'Garantía de fábrica con respaldo local de ICR',
  'Compatibilidad verificada por ingeniería antes del despacho',
  'Soporte y seguimiento postventa del sistema',
]

const TABS = [
  { id: 'ficha', label: 'Ficha técnica' },
  { id: 'envio', label: 'Envío y soporte' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function Producto() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { add } = useQuote()
  const [tab, setTab] = useState<TabId>('ficha')

  const actual = productoPorId(params.id ?? '') ?? PRODUCTOS[0]

  const tabData: Record<TabId, [string, string][]> = {
    ficha: actual.specs,
    envio: [
      ['Despacho', '48 h hábiles desde Arequipa'],
      ['Cobertura', 'Arequipa y sur del Perú'],
      ['Instalación', 'Red técnica certificada'],
      ['Soporte', 'Ingeniería postventa ICR'],
    ],
  }

  const relacionados = PRODUCTOS.filter((p) => p.id !== actual.id).slice(0, 3)

  return (
    <Container className="pt-6 pb-16">
      <div className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/45 mb-5">
        <Link href="/catalogo">Tienda</Link> / {actual.cat} / <span className="text-ink">{actual.marca}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div>
          <div className="relative border border-ink/[.16] bg-surface h-[360px] flex items-center justify-center">
            <div className="text-[11px] font-medium tracking-[.14em] uppercase text-ink/30 text-center leading-relaxed">
              Imagen de producto
              <br />
              placeholder
            </div>
          </div>
          <div className="flex gap-2.5 mt-2.5">
            {['01', '02', '03', '04'].map((t) => (
              <div
                key={t}
                className="w-[70px] h-[70px] border border-ink/[.16] bg-surface flex items-center justify-center text-[9px] tracking-[.1em] text-ink/30"
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold tracking-[.12em] uppercase text-accent-dark mb-2.5">
            {actual.marca} · SKU {actual.sku}
          </div>
          <h1 className="text-[28px] sm:text-[30px] font-black leading-tight uppercase mb-4">{actual.nombre}</h1>
          <p className="text-sm leading-relaxed text-ink/70 mb-6">{actual.desc}</p>

          <div className="flex flex-wrap gap-6 items-end border-t border-b border-ink/[.14] py-5 mb-5">
            <div>
              <div className="text-[10.5px] font-medium tracking-[.12em] uppercase text-ink/45 mb-1.5">
                Precio público
              </div>
              <div className="text-[30px] font-black tracking-tight leading-none">{money(actual.precio)}</div>
            </div>
            <div className="border-l border-ink/[.14] pl-6">
              <div className="text-[10.5px] font-medium tracking-[.12em] uppercase text-ink/45 mb-1.5 whitespace-nowrap">
                Proyecto / volumen
              </div>
              <div className="text-[13px] font-bold text-accent-dark">Precio por cotización</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 mb-5">
            <button
              onClick={() => {
                add(actual.id)
                router.push('/cotizacion')
              }}
              className="border-0 bg-ink text-white font-heading text-xs font-black tracking-[.1em] uppercase px-6 py-4 hover:bg-accent-dark transition-colors"
            >
              Añadir a cotización
            </button>
            <button className="border border-accent bg-transparent text-accent-dark font-heading text-xs font-bold tracking-[.1em] uppercase px-6 py-4 hover:bg-accent/10 transition-colors">
              Comprar ahora
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            {GARANTIAS.map((g) => (
              <div key={g} className="flex gap-2.5 text-[12.5px] text-ink/70">
                <span className="text-accent font-black">+</span>
                {g}
              </div>
            ))}
          </div>

          <div className="border border-ink/[.14]">
            <div className="flex border-b border-ink/[.14]">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 border-0 font-heading text-[11px] font-bold tracking-[.1em] uppercase px-2.5 py-3.5 transition-colors ${
                    tab === t.id ? 'bg-ink text-white' : 'bg-transparent text-ink/60 hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="px-[18px] pb-[18px]">
              {tabData[tab].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-[18px] py-3 border-b border-ink/10 last:border-b-0"
                >
                  <span className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/55">{k}</span>
                  <span className="text-[13px] font-bold text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-14">
        <h2 className="kicker text-ink/55 mb-5">Compatibles y complementarios</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {relacionados.map((p) => (
            <Link
              key={p.id}
              href={`/producto/${p.id}`}
              className="border border-ink/[.14] p-4 bg-white hover:border-accent transition-colors block"
            >
              <div className="h-24 bg-surface flex items-center justify-center text-[9.5px] tracking-[.12em] uppercase text-ink/30 mb-3.5">
                Imagen
              </div>
              <div className="text-[10.5px] font-bold tracking-[.1em] uppercase text-accent-dark mb-1.5">
                {p.marca}
              </div>
              <div className="text-[13px] font-bold leading-tight mb-2">{p.nombre}</div>
              <div className="text-[15px] font-black">{money(p.precio)}</div>
            </Link>
          ))}
        </div>
      </div>
    </Container>
  )
}

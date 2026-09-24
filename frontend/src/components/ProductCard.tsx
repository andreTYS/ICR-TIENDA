'use client'

import Link from 'next/link'
import { money, stockLabel, titleCase, type Producto } from '../data/products'
import { useQuote } from '../context/QuoteContext'
import ProductImage from './ProductImage'

export default function ProductCard({ p, size = 'default' }: { p: Producto; size?: 'default' | 'large' }) {
  const { add } = useQuote()
  const large = size === 'large'
  const stock = stockLabel(p)
  const stockColor = stock.tono === 'ok' ? 'text-emerald-700' : 'text-ink/45'

  return (
    <div
      className={`border bg-white flex flex-col hover:border-accent hover:shadow-lg transition-all ${
        large ? 'border-ink/[.16]' : 'border-ink/[.14]'
      }`}
    >
      <Link
        href={`/producto/${p.id}`}
        className={`relative bg-surface flex items-center justify-center border-b border-ink/10 ${
          large ? 'h-56 p-6 pt-10' : 'h-40 p-4 pt-8'
        }`}
      >
        <ProductImage src={p.imagen_url} alt={p.nombre} />
        <div
          className={`absolute left-0 top-0 bg-ink text-white font-bold tracking-[.1em] uppercase ${
            large ? 'text-xs px-3 py-2' : 'text-[9.5px] px-2.5 py-[5px]'
          }`}
        >
          {titleCase(p.categoria_producto)}
        </div>
        {p.destacado && (
          <div
            className={`absolute right-0 top-0 bg-accent text-ink font-black tracking-[.1em] uppercase ${
              large ? 'text-xs px-3 py-2' : 'text-[9.5px] px-2.5 py-[5px]'
            }`}
          >
            Destacado
          </div>
        )}
      </Link>
      <div className={`flex flex-col flex-1 ${large ? 'p-5' : 'p-3.5'}`}>
        <div
          className={`font-bold tracking-[.12em] uppercase text-accent-dark ${
            large ? 'text-sm mb-2' : 'text-[10.5px] mb-1.5'
          }`}
        >
          {p.marca || titleCase(p.categoria_producto)}
        </div>
        <Link
          href={`/producto/${p.id}`}
          className={`font-bold leading-tight text-ink hover:text-accent-dark transition-colors ${
            large ? 'text-xl mb-3 min-h-[58px]' : 'text-[13.5px] mb-2.5 min-h-[52px]'
          } line-clamp-3`}
        >
          {p.nombre}
        </Link>
        <div className={`text-ink/55 ${large ? 'text-sm mb-4' : 'text-[11px] mb-3'}`}>
          {p.referencia_interna ? `Ref. ${p.referencia_interna}` : titleCase(p.unidad_medida)}
        </div>
        <div className="mt-auto">
          <div className={`font-black tracking-tight ${large ? 'text-[28px] mb-1' : 'text-[17px] mb-0.5'}`}>
            {money(p.precio_venta ?? 0)}
          </div>
          <div className={`${large ? 'text-xs mb-4' : 'text-[10.5px] mb-3'}`}>
            <span className="text-ink/45">IGV incluido · </span>
            <span className={stockColor}>{stock.texto}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => add(p)}
              className={`flex-1 border-0 bg-ink text-white font-heading font-bold tracking-[.08em] uppercase hover:bg-accent-dark transition-colors ${
                large ? 'text-sm px-3 py-3.5' : 'text-[10.5px] px-2 py-[11px]'
              }`}
            >
              Cotizar
            </button>
            <Link
              href={`/producto/${p.id}`}
              className={`border border-ink/25 text-ink font-heading font-bold tracking-[.08em] uppercase hover:border-accent transition-colors text-center ${
                large ? 'text-sm px-4 py-3.5' : 'text-[10.5px] px-3 py-[11px]'
              }`}
            >
              Ficha
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

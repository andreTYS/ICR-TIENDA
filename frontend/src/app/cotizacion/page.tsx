'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuote } from '@/context/QuoteContext'
import { api } from '@/lib/api'
import Container from '@/components/Container'

const CAMPOS = [
  { key: 'empresa', label: 'Empresa o nombre', ph: 'Inversiones ejemplo S.A.C.', required: false, type: 'text' },
  { key: 'contacto', label: 'Contacto', ph: 'Nombre y cargo', required: true, type: 'text' },
  { key: 'correo', label: 'Correo', ph: 'nombre@empresa.com', required: true, type: 'email' },
  { key: 'telefono', label: 'Teléfono / WhatsApp', ph: '+51 999 999 999', required: true, type: 'tel' },
  { key: 'ciudad', label: 'Ciudad del proyecto', ph: 'Arequipa', required: false, type: 'text' },
  { key: 'consumo', label: 'Consumo mensual (kWh)', ph: '3.200 (opcional)', required: false, type: 'text' },
] as const

export default function Cotizacion() {
  const { rows, totalMoney, bump, clear } = useQuote()
  const [form, setForm] = useState<Record<string, string>>({})
  const [tipoCliente, setTipoCliente] = useState<'empresa' | 'hogar'>('empresa')
  const [enviado, setEnviado] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rows.length === 0) {
      setError('Agrega al menos un producto desde el catálogo.')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const r = await api.cotizar({
        ...form,
        tipo_cliente: tipoCliente,
        items: rows.map((r) => ({ id: r.id, qty: r.qty })),
      })
      setEnviado(r.codigo)
      clear()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Container className="pt-6 pb-16">
      <div className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/45 mb-4">
        Inicio / <span className="text-ink">Solicitud de cotización</span>
      </div>
      <h1 className="text-3xl sm:text-[34px] font-black uppercase leading-none mb-2.5">
        Solicitud de cotización
      </h1>
      <p className="text-[13.5px] text-ink/65 mb-7 max-w-[640px]">
        Revisamos compatibilidad, dimensionamiento y disponibilidad antes de responder. Tiempo de respuesta: 24
        horas hábiles.
      </p>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-7 items-start">
        <div>
          <div className="border border-ink/[.14]">
            <div className="flex bg-ink text-white/70 text-[10.5px] font-bold tracking-[.12em] uppercase px-4 py-3">
              <span className="flex-1">Referencia</span>
              <span className="w-20 text-center">Cant.</span>
              <span className="w-[120px] text-right">Subtotal</span>
            </div>
            {rows.map((r) => (
              <div key={r.id} className="flex items-center p-4 border-b border-ink/10 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10.5px] font-bold tracking-[.1em] uppercase text-accent-dark mb-1">
                    {r.marca} · {r.sku}
                  </div>
                  <Link href={`/producto/${r.id}`} className="text-[13.5px] font-bold leading-tight block text-ink">
                    {r.nombre}
                  </Link>
                  <div className="text-[11px] text-ink/50 mt-1">{r.spec}</div>
                </div>
                <div className="w-20 flex justify-center items-center border border-ink/20">
                  <button
                    onClick={() => bump(r.id, -1)}
                    className="border-0 bg-transparent text-ink font-heading text-sm font-bold w-6 h-[30px] cursor-pointer"
                    aria-label="Disminuir cantidad"
                  >
                    –
                  </button>
                  <span className="text-[13px] font-bold w-6 text-center">{r.qty}</span>
                  <button
                    onClick={() => bump(r.id, 1)}
                    className="border-0 bg-transparent text-ink font-heading text-sm font-bold w-6 h-[30px] cursor-pointer"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>
                <div className="w-[120px] text-right text-sm font-black">{r.subtotal}</div>
              </div>
            ))}
            {rows.length === 0 && (
              <div className="py-10 px-4 text-center text-ink/50 text-[13px]">
                Aún no has agregado referencias.
                <div className="mt-4">
                  <Link
                    href="/catalogo"
                    className="inline-block border border-ink/25 bg-transparent text-ink font-heading text-[11px] font-bold tracking-[.1em] uppercase px-5 py-3"
                  >
                    Ir al catálogo
                  </Link>
                </div>
              </div>
            )}
            <div className="flex justify-between items-baseline px-4 py-[18px] bg-surface">
              <span className="text-[11px] font-bold tracking-[.12em] uppercase text-ink/60">
                Total de referencia
              </span>
              <span className="text-2xl font-black tracking-tight">{totalMoney}</span>
            </div>
          </div>
          <div className="mt-3.5 text-[11.5px] text-ink/50 leading-relaxed">
            El total es de referencia. La cotización final incluye ingeniería, estructura, mano de obra y
            transporte según el sitio del proyecto.
          </div>
        </div>

        <div className="border border-ink/[.14] p-[22px]">
          {enviado ? (
            <div className="text-center py-8">
              <div className="text-accent-dark font-heading font-black text-lg uppercase mb-2">
                Solicitud enviada
              </div>
              <div className="text-[12px] font-bold tracking-[.1em] uppercase text-ink/60 mb-3">
                N.º de solicitud: <span className="text-ink">{enviado}</span>
              </div>
              <p className="text-[13px] text-ink/65">
                Un ingeniero de ICR revisa tu solicitud y responde con dimensionamiento y disponibilidad en 24
                horas hábiles.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <div className="text-[11px] font-black tracking-[.12em] uppercase pb-3.5 border-b border-ink/[.14] mb-[18px]">
                Datos del proyecto
              </div>
              <div className="flex flex-col gap-3.5">
                {CAMPOS.map((c) => (
                  <div key={c.key}>
                    <div className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/50 mb-1.5">
                      {c.label}
                    </div>
                    <input
                      required={c.required}
                      type={c.type}
                      value={form[c.key] ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
                      placeholder={c.ph}
                      className="w-full border border-ink/20 px-3 py-2.5 text-[12.5px] text-ink placeholder:text-ink/40 outline-none focus:border-accent"
                    />
                  </div>
                ))}
                <div>
                  <div className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/50 mb-1.5">
                    Tipo de cliente
                  </div>
                  <div className="flex border border-ink/20">
                    {(['empresa', 'hogar'] as const).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setTipoCliente(t)}
                        className={`flex-1 text-center font-heading text-[11px] font-bold tracking-[.08em] uppercase px-1.5 py-2.5 transition-colors ${
                          tipoCliente === t ? 'bg-ink text-white' : 'text-ink/60'
                        }`}
                      >
                        {t === 'empresa' ? 'Empresa' : 'Hogar'}
                      </button>
                    ))}
                  </div>
                </div>
                {error && <div className="text-[12px] text-red-700 font-medium">{error}</div>}
                <button
                  type="submit"
                  disabled={enviando}
                  className="border-0 bg-accent text-ink font-heading text-xs font-black tracking-[.1em] uppercase px-4 py-4 mt-1 hover:bg-accent-2 transition-colors disabled:opacity-60"
                >
                  {enviando ? 'Enviando…' : 'Enviar solicitud'}
                </button>
                <div className="text-[11px] text-ink/50 leading-relaxed">
                  Un ingeniero de ICR revisa la solicitud y responde con dimensionamiento y disponibilidad.
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </Container>
  )
}

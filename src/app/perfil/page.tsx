'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Container from '@/components/Container'
import { useAuth } from '@/context/AuthContext'
import { money } from '@/data/products'

const PEDIDOS_EN_CURSO = [
  {
    id: 'ICR-2314',
    fecha: '02 sep 2026',
    resumen: 'Inversor híbrido Deye SUN-8K-SG04LP3-EU × 1, Batería Pylontech US5000 × 4',
    total: 30300,
    estado: 'En preparación',
  },
  {
    id: 'ICR-2298',
    fecha: '28 ago 2026',
    resumen: 'Panel Jinko Tiger Neo 580 W × 12, Riel de aluminio K2 Systems × 8',
    total: 8560,
    estado: 'En camino',
  },
]

const HISTORIAL_PEDIDOS = [
  {
    id: 'ICR-2201',
    fecha: '14 jul 2026',
    resumen: 'Huawei SmartLogger 3000A × 1',
    total: 1450,
    estado: 'Entregado',
  },
  {
    id: 'ICR-2144',
    fecha: '02 jun 2026',
    resumen: 'Microinversor Hoymiles HMS-2000-4T × 3',
    total: 3870,
    estado: 'Entregado',
  },
  {
    id: 'ICR-2087',
    fecha: '19 abr 2026',
    resumen: 'Banco Dyness PowerBox 15 kWh HV × 1',
    total: 16500,
    estado: 'Entregado',
  },
]

const ESTADO_COLOR: Record<string, string> = {
  'En preparación': 'bg-surface text-accent-dark',
  'En camino': 'bg-accent text-ink',
  Entregado: 'bg-surface text-ink/60',
}

export default function Perfil() {
  const { user, ready, logout, updateProfile } = useAuth()
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ nombre: '', correo: '', empresa: '', telefono: '' })

  useEffect(() => {
    if (ready && !user) router.replace('/login')
    if (user) {
      setForm({
        nombre: user.nombre,
        correo: user.correo,
        empresa: user.empresa ?? '',
        telefono: user.telefono ?? '',
      })
    }
  }, [ready, user, router])

  if (!user) return null

  const guardarPerfil = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      nombre: form.nombre,
      correo: form.correo,
      empresa: form.empresa || undefined,
      telefono: form.telefono || undefined,
    })
    setEditando(false)
  }

  return (
    <Container className="pt-6 pb-20">
      <div className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/45 mb-4">
        Inicio / <span className="text-ink">Mi perfil</span>
      </div>

      <div className="flex flex-wrap gap-4 items-end justify-between border-b border-ink/[.14] pb-5 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase leading-none mb-2">Hola, {user.nombre.split(' ')[0]}</h1>
          <p className="text-[13px] text-ink/60 m-0">{user.correo}</p>
        </div>
        <button
          onClick={() => {
            logout()
            router.push('/')
          }}
          className="border border-ink/20 text-ink font-heading text-[11px] font-bold tracking-[.1em] uppercase px-5 py-3 hover:border-accent transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
        {/* Datos del perfil */}
        <div className="border border-ink/[.14] p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="text-[11px] font-black tracking-[.12em] uppercase">Datos del perfil</div>
            {!editando && (
              <button
                onClick={() => setEditando(true)}
                className="text-[11px] font-bold tracking-[.08em] uppercase text-accent-dark hover:underline"
              >
                Editar
              </button>
            )}
          </div>

          {editando ? (
            <form onSubmit={guardarPerfil} className="flex flex-col gap-3.5">
              {(
                [
                  ['nombre', 'Nombre completo'],
                  ['correo', 'Correo electrónico'],
                  ['empresa', 'Empresa'],
                  ['telefono', 'Teléfono'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <div className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/50 mb-1.5">
                    {label}
                  </div>
                  <input
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-ink/20 px-3 py-2.5 text-[13px] text-ink outline-none focus:border-accent"
                  />
                </div>
              ))}
              <div className="flex gap-2 mt-1">
                <button
                  type="submit"
                  className="flex-1 border-0 bg-ink text-white font-heading text-[11px] font-bold tracking-[.1em] uppercase px-4 py-3 hover:bg-accent-dark transition-colors"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setEditando(false)}
                  className="border border-ink/20 text-ink font-heading text-[11px] font-bold tracking-[.1em] uppercase px-4 py-3"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <dl className="flex flex-col gap-3.5">
              {[
                ['Nombre', user.nombre],
                ['Correo', user.correo],
                ['Empresa', user.empresa || '—'],
                ['Teléfono', user.telefono || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/45 mb-1">
                    {label}
                  </dt>
                  <dd className="text-[13px] font-bold text-ink m-0">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Pedidos */}
        <div className="flex flex-col gap-10">
          <div>
            <h2 className="kicker text-ink/55 mb-4">Pedidos en curso</h2>
            <div className="border border-ink/[.14] divide-y divide-ink/10">
              {PEDIDOS_EN_CURSO.map((p) => (
                <div key={p.id} className="p-4 flex flex-wrap gap-3 items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-bold tracking-[.1em] uppercase text-accent-dark mb-1">
                      {p.id} · {p.fecha}
                    </div>
                    <div className="text-[13px] text-ink/80">{p.resumen}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10.5px] font-bold tracking-[.08em] uppercase px-2.5 py-1 ${ESTADO_COLOR[p.estado]}`}
                    >
                      {p.estado}
                    </span>
                    <span className="text-sm font-black">{money(p.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="kicker text-ink/55 mb-4">Historial de pedidos</h2>
            <div className="border border-ink/[.14] divide-y divide-ink/10">
              {HISTORIAL_PEDIDOS.map((p) => (
                <div key={p.id} className="p-4 flex flex-wrap gap-3 items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-bold tracking-[.1em] uppercase text-accent-dark mb-1">
                      {p.id} · {p.fecha}
                    </div>
                    <div className="text-[13px] text-ink/80">{p.resumen}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10.5px] font-bold tracking-[.08em] uppercase px-2.5 py-1 ${ESTADO_COLOR[p.estado]}`}
                    >
                      {p.estado}
                    </span>
                    <span className="text-sm font-black">{money(p.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}

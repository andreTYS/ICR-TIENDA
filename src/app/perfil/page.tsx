'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Container from '@/components/Container'
import { useAuth } from '@/context/AuthContext'
import { money } from '@/data/products'
import type { PedidoTienda } from '@/lib/erp'

// Un "pedido" acá es una Cotización o un Contrato real del ERP, del cliente
// formal (tabla `clientes`) cuyo RUC/DNI coincide con el de esta cuenta de
// tienda — ver tiendaAuthService.obtenerPedidos. No existe un concepto de
// "pedido de e-commerce" separado: este negocio vende por cotización.
const ESTADO_LABEL: Record<string, string> = {
  'COTIZACION:BORRADOR': 'Cotización en preparación',
  'COTIZACION:ENVIADA': 'Cotización enviada',
  'COTIZACION:ACEPTADA': 'Cotización aceptada',
  'COTIZACION:RECHAZADA': 'Cotización rechazada',
  'COTIZACION:CONVERTIDA': 'Convertida en contrato',
  'CONTRATO:BORRADOR': 'Contrato en preparación',
  'CONTRATO:VIGENTE': 'Contrato vigente',
  'CONTRATO:FINALIZADO': 'Contrato finalizado',
  'CONTRATO:CANCELADO': 'Contrato cancelado',
}

const ESTADOS_EN_CURSO = new Set(['COTIZACION:BORRADOR', 'COTIZACION:ENVIADA', 'COTIZACION:ACEPTADA', 'CONTRATO:BORRADOR', 'CONTRATO:VIGENTE'])

const ESTADO_COLOR: Record<string, string> = {
  'COTIZACION:BORRADOR': 'bg-surface text-ink/60',
  'COTIZACION:ENVIADA': 'bg-surface text-accent-dark',
  'COTIZACION:ACEPTADA': 'bg-accent text-ink',
  'COTIZACION:RECHAZADA': 'bg-surface text-ink/60',
  'COTIZACION:CONVERTIDA': 'bg-accent text-ink',
  'CONTRATO:BORRADOR': 'bg-surface text-ink/60',
  'CONTRATO:VIGENTE': 'bg-accent text-ink',
  'CONTRATO:FINALIZADO': 'bg-surface text-ink/60',
  'CONTRATO:CANCELADO': 'bg-surface text-ink/60',
}

function PedidoRow({ p }: { p: PedidoTienda }) {
  const clave = `${p.tipo}:${p.estado}`
  const fecha = p.fecha ? new Date(p.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  return (
    <div className="p-4 flex flex-wrap gap-3 items-center justify-between">
      <div className="min-w-0">
        <div className="text-[10.5px] font-bold tracking-[.1em] uppercase text-accent-dark mb-1">
          {p.codigo} · {fecha}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-[10.5px] font-bold tracking-[.08em] uppercase px-2.5 py-1 ${ESTADO_COLOR[clave] || 'bg-surface text-ink/60'}`}>
          {ESTADO_LABEL[clave] || p.estado}
        </span>
        <span className="text-sm font-black">{money(Number(p.monto))}</span>
      </div>
    </div>
  )
}

export default function Perfil() {
  const { user, token, ready, logout, updateProfile } = useAuth()
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null)
  const [form, setForm] = useState({ nombre: '', telefono: '', empresa: '', ruc: '' })

  const [pedidos, setPedidos] = useState<PedidoTienda[] | null>(null)
  const [razonSocial, setRazonSocial] = useState<string | undefined>()
  const [errorPedidos, setErrorPedidos] = useState<string | null>(null)

  useEffect(() => {
    if (ready && !user) router.replace('/login')
    if (user) {
      setForm({
        nombre: user.nombre,
        telefono: user.telefono ?? '',
        empresa: user.empresa ?? '',
        ruc: user.ruc ?? user.dni ?? '',
      })
    }
  }, [ready, user, router])

  useEffect(() => {
    if (!token) return
    let cancelado = false
    fetch('/api/auth/pedidos', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (cancelado) return
        if (data.status === 'success') {
          setPedidos(data.pedidos || [])
          setRazonSocial(data.razonSocial)
        } else {
          setErrorPedidos(data.error || 'No se pudo cargar el historial de pedidos')
        }
      })
      .catch(() => !cancelado && setErrorPedidos('No se pudo cargar el historial de pedidos'))
    return () => {
      cancelado = true
    }
  }, [token])

  if (!user) return null

  const enCurso = (pedidos || []).filter((p) => ESTADOS_EN_CURSO.has(`${p.tipo}:${p.estado}`))
  const concluidos = (pedidos || []).filter((p) => !ESTADOS_EN_CURSO.has(`${p.tipo}:${p.estado}`))

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorPerfil(null)
    setGuardando(true)
    try {
      const rucODni = form.ruc.trim()
      await updateProfile({
        nombre: form.nombre,
        telefono: form.telefono || undefined,
        empresa: form.empresa || undefined,
        ruc: /^\d{11}$/.test(rucODni) ? rucODni : undefined,
        dni: rucODni && !/^\d{11}$/.test(rucODni) ? rucODni : undefined,
      })
      setEditando(false)
    } catch (err) {
      setErrorPerfil(err instanceof Error ? err.message : 'No se pudo actualizar el perfil')
    } finally {
      setGuardando(false)
    }
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
                  ['empresa', 'Empresa'],
                  ['telefono', 'Teléfono'],
                  ['ruc', 'RUC o DNI'],
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
              {errorPerfil && <p className="text-[12.5px] text-red-600">{errorPerfil}</p>}
              <div className="flex gap-2 mt-1">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 border-0 bg-ink text-white font-heading text-[11px] font-bold tracking-[.1em] uppercase px-4 py-3 hover:bg-accent-dark transition-colors disabled:opacity-60"
                >
                  {guardando ? 'Guardando…' : 'Guardar'}
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
                ['RUC / DNI', user.ruc || user.dni || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/45 mb-1">
                    {label}
                  </dt>
                  <dd className="text-[13px] font-bold text-ink m-0">{value}</dd>
                </div>
              ))}
              {razonSocial && (
                <div>
                  <dt className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/45 mb-1">
                    Cliente ICR vinculado
                  </dt>
                  <dd className="text-[13px] font-bold text-ink m-0">{razonSocial}</dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Pedidos */}
        <div className="flex flex-col gap-10">
          {errorPedidos && <p className="text-[13px] text-red-600">{errorPedidos}</p>}

          {pedidos === null && !errorPedidos && (
            <p className="text-[13px] text-ink/50">Cargando tus cotizaciones y contratos…</p>
          )}

          {pedidos !== null && pedidos.length === 0 && (
            <div className="border border-ink/[.14] p-6 text-[13px] text-ink/60">
              {user.ruc || user.dni
                ? 'Todavía no tienes cotizaciones ni contratos registrados con este RUC/DNI en ICR.'
                : 'Agrega tu RUC o DNI en "Datos del perfil" para ver aquí tus cotizaciones y contratos con ICR.'}
            </div>
          )}

          {enCurso.length > 0 && (
            <div>
              <h2 className="kicker text-ink/55 mb-4">Pedidos en curso</h2>
              <div className="border border-ink/[.14] divide-y divide-ink/10">
                {enCurso.map((p) => (
                  <PedidoRow key={p.codigo} p={p} />
                ))}
              </div>
            </div>
          )}

          {concluidos.length > 0 && (
            <div>
              <h2 className="kicker text-ink/55 mb-4">Historial de pedidos</h2>
              <div className="border border-ink/[.14] divide-y divide-ink/10">
                {concluidos.map((p) => (
                  <PedidoRow key={p.codigo} p={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}

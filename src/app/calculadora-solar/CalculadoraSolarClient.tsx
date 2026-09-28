'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Container from '@/components/Container'
import { money } from '@/data/products'
import { useProducts } from '@/context/ProductsContext'
import { useQuote } from '@/context/QuoteContext'
import {
  ZONAS,
  TIPOS_SISTEMA,
  calcularTresVariantes,
  type InputsCalculadora,
  type ResultadoVariante,
  type TipoSistema,
} from '@/lib/dimensionadorSolar'
import {
  panelesDisponibles,
  sugerirPanel,
  sugerirInversor,
  sugerirBateria,
  calcularInversionEstimada,
  type EquipamientoSugerido,
} from '@/lib/matchEquiposSolares'

const NOMBRE_TIPO: Record<TipoSistema, string> = {
  'ON-GRID': 'On-grid',
  HIBRIDO: 'Híbrido',
  'OFF-GRID': 'Off-grid',
}

const DESC_TIPO: Record<TipoSistema, string> = {
  'ON-GRID': 'Conectado a la red, sin baterías. Reduce tu factura cubriendo el consumo de día.',
  HIBRIDO: 'Red + banco de baterías. Cubre día y noche, y sigue funcionando ante un corte.',
  'OFF-GRID': 'Aislado de la red, 100% con baterías y días de autonomía frente a días nublados.',
}

export default function CalculadoraSolarClient() {
  const { productos } = useProducts()
  const { add } = useQuote()
  const router = useRouter()

  const paneles = useMemo(() => panelesDisponibles(productos), [productos])
  const panelWpPorDefecto = paneles.length > 0 ? paneles[paneles.length - 1].wp : 550

  const [zona, setZona] = useState(ZONAS[0])
  const [pagoRecibo, setPagoRecibo] = useState('')
  const [tarifaSinIgv, setTarifaSinIgv] = useState(0.74)
  const [porcentajeDia, setPorcentajeDia] = useState(80)
  const [potenciaPico, setPotenciaPico] = useState(3)
  const [panelWp, setPanelWp] = useState<number | null>(null)
  const [avanzado, setAvanzado] = useState(false)
  const [calculado, setCalculado] = useState(false)

  const wpElegido = panelWp ?? panelWpPorDefecto

  const inputs: InputsCalculadora = {
    zona,
    pagoRecibo: Number(pagoRecibo) || 0,
    tarifaSinIgv,
    igv: 0.18,
    porcentajeConsumoDia: porcentajeDia / 100,
    potenciaPicoCargas: potenciaPico,
    panelWp: wpElegido,
  }

  const resultados = useMemo(() => calcularTresVariantes(inputs), [inputs])

  const equipamiento = useMemo(() => {
    const salida: Record<TipoSistema, EquipamientoSugerido> = {} as Record<TipoSistema, EquipamientoSugerido>
    for (const tipo of TIPOS_SISTEMA) {
      const r = resultados[tipo]
      const panel = sugerirPanel(productos, wpElegido)
      const inversor = sugerirInversor(productos, tipo, r.potenciaInversorMinKw)
      const bateria = tipo === 'ON-GRID' ? null : sugerirBateria(productos, r.bateriaKwhRequerida)
      salida[tipo] = { panel, cantidadPaneles: r.cantidadPaneles, inversor, bateria }
    }
    return salida
  }, [resultados, productos, wpElegido])

  const recomendado = useMemo(() => {
    const candidatos = TIPOS_SISTEMA.filter((t) => resultados[t].coberturaPct >= 0.9)
    if (candidatos.length === 0) return 'ON-GRID' as TipoSistema
    if (candidatos.includes('HIBRIDO')) return 'HIBRIDO' as TipoSistema
    return candidatos.sort((a, b) => calcularRetorno(a, resultados, equipamiento) - calcularRetorno(b, resultados, equipamiento))[0]
  }, [resultados, equipamiento])

  const onCalcular = (e: React.FormEvent) => {
    e.preventDefault()
    setCalculado(true)
    document.getElementById('resultados-calculadora')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const onSolicitarCotizacion = (tipo: TipoSistema) => {
    const equipo = equipamiento[tipo]
    const r = resultados[tipo]
    if (equipo.panel) add(equipo.panel.producto.id, equipo.cantidadPaneles)
    if (equipo.inversor) add(equipo.inversor.producto.id, 1)
    if (equipo.bateria) add(equipo.bateria.producto.id, equipo.bateria.cantidad)

    try {
      sessionStorage.setItem(
        'icr_calculadora_solar',
        JSON.stringify({
          tipo: NOMBRE_TIPO[tipo],
          zona,
          consumoMensualKwh: Math.round(r.energiaMensualKwh),
          kwp: r.kwpPaneles.toFixed(2),
          cantidadPaneles: r.cantidadPaneles,
          ahorroMensual: Math.round(r.ahorroMensual),
          ahorroAnual: Math.round(r.ahorroAnual),
          coberturaPct: Math.round(r.coberturaPct * 100),
        })
      )
    } catch {
      // sessionStorage puede fallar en navegación privada — no bloquea el flujo
    }

    router.push('/cotizacion')
  }

  return (
    <div>
      <Container className="pt-6">
        <div className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/45 mb-4">
          Inicio / <span className="text-ink">Calculadora solar</span>
        </div>
        <div className="border-b border-ink/[.14] pb-6 mb-10 max-w-[720px]">
          <div className="text-[11px] font-bold tracking-[.2em] uppercase text-accent-dark mb-2">
            Dimensionamiento instantáneo
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase leading-none mb-3">
            ¿Cuánto sistema solar necesitas?
          </h1>
          <p className="text-[13.5px] text-ink/65 m-0">
            Con tu recibo de luz y tu zona, calculamos las 3 variantes (on-grid, híbrido y off-grid) con equipos
            reales de nuestro catálogo: paneles, inversor y baterías, ahorro estimado y retorno de inversión.
          </p>
        </div>
      </Container>

      <Container className="pb-14">
        <div className="grid lg:grid-cols-[380px_1fr] gap-8 items-start">
          <form onSubmit={onCalcular} className="border border-ink/[.14] bg-white p-6 lg:sticky lg:top-[110px]">
            <div className="text-[11px] font-black tracking-[.12em] uppercase pb-3.5 border-b border-ink/[.14] mb-[18px]">
              Datos de tu consumo
            </div>

            <Campo label="Zona / departamento">
              <select
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                className="w-full border border-ink/20 px-3 py-2.5 text-[12.5px] text-ink outline-none focus:border-accent bg-white"
              >
                {ZONAS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Pago del recibo de luz (con IGV)">
              <div className="flex items-center border border-ink/20 focus-within:border-accent">
                <span className="pl-3 text-[12.5px] text-ink/50">S/</span>
                <input
                  required
                  type="number"
                  min={1}
                  step="0.01"
                  value={pagoRecibo}
                  onChange={(e) => setPagoRecibo(e.target.value)}
                  placeholder="Ej. 350"
                  className="w-full px-2 py-2.5 text-[12.5px] text-ink placeholder:text-ink/40 outline-none"
                />
              </div>
            </Campo>

            <Campo label={`% de tu consumo que ocurre de día — ${porcentajeDia}%`}>
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={porcentajeDia}
                onChange={(e) => setPorcentajeDia(Number(e.target.value))}
                className="w-full accent-accent"
              />
            </Campo>

            <button
              type="button"
              onClick={() => setAvanzado((v) => !v)}
              className="text-[11px] font-bold tracking-[.08em] uppercase text-accent-dark mb-3.5"
            >
              {avanzado ? '− Ocultar ajustes avanzados' : '+ Ajustes avanzados (tarifa, panel, potencia pico)'}
            </button>

            {avanzado && (
              <div className="mb-1 pt-1 border-t border-ink/10">
                <Campo label="Tarifa eléctrica sin IGV (S/ por kWh)">
                  <input
                    type="number"
                    min={0.1}
                    step="0.01"
                    value={tarifaSinIgv}
                    onChange={(e) => setTarifaSinIgv(Number(e.target.value) || 0)}
                    className="w-full border border-ink/20 px-3 py-2.5 text-[12.5px] text-ink outline-none focus:border-accent"
                  />
                </Campo>
                <Campo label="Potencia máxima que usarías a la vez (kW)">
                  <input
                    type="number"
                    min={0.5}
                    step="0.5"
                    value={potenciaPico}
                    onChange={(e) => setPotenciaPico(Number(e.target.value) || 0)}
                    className="w-full border border-ink/20 px-3 py-2.5 text-[12.5px] text-ink outline-none focus:border-accent"
                  />
                  <div className="text-[11px] text-ink/45 mt-1.5">Solo afecta a híbrido y off-grid.</div>
                </Campo>
                {paneles.length > 0 && (
                  <Campo label="Panel a usar en el cálculo">
                    <select
                      value={wpElegido}
                      onChange={(e) => setPanelWp(Number(e.target.value))}
                      className="w-full border border-ink/20 px-3 py-2.5 text-[12.5px] text-ink outline-none focus:border-accent bg-white"
                    >
                      {paneles.map((p) => (
                        <option key={p.wp} value={p.wp}>
                          {p.wp} Wp — {p.producto.nombre}
                        </option>
                      ))}
                    </select>
                  </Campo>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={!pagoRecibo || Number(pagoRecibo) <= 0}
              className="w-full border-0 bg-accent text-ink font-heading text-xs font-black tracking-[.1em] uppercase px-4 py-4 mt-2 hover:bg-accent-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Calcular mi sistema
            </button>
            <p className="text-[11px] text-ink/45 leading-relaxed mt-3 mb-0">
              Estimado con HSP de tu zona y tu recibo. El dimensionamiento final lo confirma un ingeniero de ICR.
            </p>
          </form>

          <div id="resultados-calculadora">
            {!calculado ? (
              <div className="border border-dashed border-ink/20 bg-surface p-10 text-center text-ink/50 text-[13px]">
                Completa tu recibo de luz y dale a &ldquo;Calcular mi sistema&rdquo; para ver las 3 variantes con
                equipos reales de nuestro catálogo.
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-3 gap-4 mb-4">
                  {TIPOS_SISTEMA.map((tipo) => (
                    <TarjetaVariante
                      key={tipo}
                      tipo={tipo}
                      resultado={resultados[tipo]}
                      equipo={equipamiento[tipo]}
                      recomendado={tipo === recomendado}
                      onSolicitar={() => onSolicitarCotizacion(tipo)}
                    />
                  ))}
                </div>
                <p className="text-[11.5px] text-ink/50 leading-relaxed">
                  Los equipos sugeridos son los que mejor calzan hoy en nuestro catálogo real — precios en soles
                  con IGV. La inversión estimada incluye un cálculo referencial de estructura, cableado,
                  protecciones e instalación; el presupuesto final lo confirma un ingeniero de ICR.
                </p>
              </>
            )}
          </div>
        </div>
      </Container>

      <Container className="mb-14">
        <div className="bg-ink text-white p-8 sm:p-11 flex flex-wrap gap-6 items-center justify-between">
          <div className="max-w-[520px]">
            <h2 className="text-2xl sm:text-[28px] font-black uppercase leading-tight mb-3">
              ¿Prefieres que te asesore un ingeniero?
            </h2>
            <p className="text-sm leading-relaxed text-white/75 m-0">
              Cuéntanos tu caso directamente y te ayudamos con el dimensionamiento exacto para tu proyecto.
            </p>
          </div>
          <Link
            href="/cotizacion"
            className="border-0 bg-accent text-ink font-heading text-xs font-black tracking-[.1em] uppercase px-7 py-4 hover:bg-accent-2 transition-colors"
          >
            Hablar con ingeniería
          </Link>
        </div>
      </Container>
    </div>
  )
}

function calcularRetorno(
  tipo: TipoSistema,
  resultados: Record<TipoSistema, ResultadoVariante>,
  equipamiento: Record<TipoSistema, EquipamientoSugerido>
): number {
  const r = resultados[tipo]
  const inversion = calcularInversionEstimada(equipamiento[tipo])
  return r.ahorroAnual > 0 ? inversion / r.ahorroAnual : Infinity
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/50 mb-1.5">{label}</div>
      {children}
    </div>
  )
}

function BarraCobertura({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(1, pct))
  return (
    <div className="h-[6px] bg-ink/10 relative mb-1.5">
      <div className="absolute left-0 top-0 bottom-0 bg-accent" style={{ width: `${clamped * 100}%` }} />
    </div>
  )
}

function TarjetaVariante({
  tipo,
  resultado,
  equipo,
  recomendado,
  onSolicitar,
}: {
  tipo: TipoSistema
  resultado: ResultadoVariante
  equipo: EquipamientoSugerido
  recomendado: boolean
  onSolicitar: () => void
}) {
  const inversion = calcularInversionEstimada(equipo)
  const retornoAnios = resultado.ahorroAnual > 0 ? inversion / resultado.ahorroAnual : null

  return (
    <div
      className={`border bg-white flex flex-col ${
        recomendado ? 'border-accent shadow-lg' : 'border-ink/[.14]'
      }`}
    >
      {recomendado && (
        <div className="bg-accent text-ink text-[10.5px] font-black tracking-[.12em] uppercase text-center py-2">
          Recomendado para ti
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-black uppercase leading-none mb-1.5">{NOMBRE_TIPO[tipo]}</h3>
        <p className="text-[11.5px] text-ink/55 leading-relaxed mb-4 min-h-[48px]">{DESC_TIPO[tipo]}</p>

        <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-ink/10">
          <MiniStat label="Potencia" value={`${resultado.kwpPaneles.toFixed(1)} kWp`} />
          <MiniStat label="Paneles" value={`${resultado.cantidadPaneles} und`} />
        </div>

        <div className="mb-4 pb-4 border-b border-ink/10 flex flex-col gap-2.5">
          <EquipoLinea etiqueta="Inversor" producto={equipo.inversor?.producto} detalle={equipo.inversor ? `${equipo.inversor.kw} kW` : undefined} />
          {tipo !== 'ON-GRID' && (
            <EquipoLinea
              etiqueta="Baterías"
              producto={equipo.bateria?.producto}
              detalle={equipo.bateria ? `${equipo.bateria.cantidad} und · ${(equipo.bateria.kwhUnidad * equipo.bateria.cantidad).toFixed(1)} kWh` : undefined}
            />
          )}
        </div>

        <div className="mb-4">
          <div className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/50 mb-1">
            Cobertura de tu consumo
          </div>
          <BarraCobertura pct={resultado.coberturaPct} />
          <div className="text-[11px] text-ink/50">{Math.round(resultado.coberturaPct * 100)}% del consumo mensual</div>
        </div>

        <div className="mb-4">
          <div className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/50 mb-1">Ahorro mensual</div>
          <div className="text-2xl font-black tracking-tight text-accent-dark">{money(Math.round(resultado.ahorroMensual))}</div>
          <div className="text-[11px] text-ink/45">{money(Math.round(resultado.ahorroAnual))} al año</div>
        </div>

        <div className="mt-auto pt-4 border-t border-ink/10">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/50">Inversión estimada</span>
            <span className="text-sm font-black">{money(Math.round(inversion))}</span>
          </div>
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/50">Retorno</span>
            <span className="text-sm font-black">{retornoAnios ? `${retornoAnios.toFixed(1)} años` : '—'}</span>
          </div>
          <button
            onClick={onSolicitar}
            className="w-full border-0 bg-ink text-white font-heading text-[11px] font-bold tracking-[.08em] uppercase px-3 py-3.5 hover:bg-accent-dark transition-colors"
          >
            Solicitar esta cotización
          </button>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium tracking-[.08em] uppercase text-ink/45 mb-0.5">{label}</div>
      <div className="text-sm font-black text-ink">{value}</div>
    </div>
  )
}

function EquipoLinea({
  etiqueta,
  producto,
  detalle,
}: {
  etiqueta: string
  producto?: { nombre: string; precio: number } | null
  detalle?: string
}) {
  return (
    <div>
      <div className="text-[10px] font-medium tracking-[.08em] uppercase text-ink/45 mb-0.5">{etiqueta}</div>
      {producto ? (
        <>
          <div className="text-[12px] font-bold text-ink leading-snug">{producto.nombre}</div>
          <div className="text-[11px] text-ink/50">
            {detalle ? `${detalle} · ` : ''}
            {money(producto.precio)}
          </div>
        </>
      ) : (
        <div className="text-[11.5px] text-ink/45 italic">A definir por nuestro equipo técnico</div>
      )}
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import Container from '@/components/Container'
import { SOLUCIONES, type SolucionId } from '@/data/products'

export const metadata: Metadata = {
  title: 'Soluciones | Inversiones ICR',
}

interface Problema {
  pregunta: string
  contexto: string
  solucionId: SolucionId
  solucionNombre: string
  recomendacion: string
}

const PROBLEMAS: Problema[] = [
  {
    pregunta: '"Vivo lejos y no tengo acceso a la red eléctrica"',
    contexto: 'Tu vivienda, negocio o campamento está fuera del alcance de la red de distribución.',
    solucionId: 'offgrid',
    solucionNombre: 'Sistemas off-grid y on-grid',
    recomendacion:
      'Un sistema aislado con paneles solares, banco de baterías y controlador te da energía propia sin depender del tendido eléctrico.',
  },
  {
    pregunta: '"Se corta la luz seguido y pierdo equipos o producción"',
    contexto: 'Los cortes de red interrumpen procesos, refrigeración, cómputo o equipos críticos.',
    solucionId: 'respaldo',
    solucionNombre: 'Respaldo energético',
    recomendacion:
      'Un inversor híbrido con banco de baterías conmuta automáticamente ante falla de red, sin interrumpir tu operación.',
  },
  {
    pregunta: '"Pago una factura de luz muy alta cada mes"',
    contexto: 'Tu consumo es alto y quieres reducir el costo de energía a mediano plazo.',
    solucionId: 'autoconsumo',
    solucionNombre: 'Autoconsumo en red',
    recomendacion:
      'Un sistema on-grid conectado a la red, con medición bidireccional, reduce tu factura generando tu propia energía de día.',
  },
  {
    pregunta: '"No sé cuánta energía consumo ni si mi sistema funciona bien"',
    contexto: 'Necesitas visibilidad de generación, consumo y alarmas para operar con datos.',
    solucionId: 'monitoreo',
    solucionNombre: 'Monitoreo y calidad',
    recomendacion:
      'Un controlador de planta con monitoreo remoto reporta generación, alarmas y calidad de energía en tiempo real.',
  },
  {
    pregunta: '"Mi empresa necesita continuidad operativa las 24 horas"',
    contexto: 'Una interrupción de energía significa pérdidas económicas o riesgo operativo.',
    solucionId: 'respaldo',
    solucionNombre: 'Respaldo energético',
    recomendacion:
      'Dimensionamos bancos de baterías y equipos híbridos de uso industrial con contrato de soporte y repuestos.',
  },
  {
    pregunta: '"Quiero generar mi propia energía en una obra o zona agrícola"',
    contexto: 'El proyecto no tiene conexión eléctrica cercana o es temporal.',
    solucionId: 'offgrid',
    solucionNombre: 'Sistemas off-grid y on-grid',
    recomendacion:
      'Kits solares portátiles o fijos con almacenamiento, dimensionados para telecom, agro y obra.',
  },
]

export default function Soluciones() {
  return (
    <div>
      <Container className="pt-6">
        <div className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/45 mb-4">
          Inicio / <span className="text-ink">Soluciones</span>
        </div>
        <div className="border-b border-ink/[.14] pb-6 mb-10 max-w-[680px]">
          <h1 className="text-3xl sm:text-4xl font-black uppercase leading-none mb-3">
            Encuentra tu solución energética
          </h1>
          <p className="text-[13.5px] text-ink/65 m-0">
            Cuatro líneas de trabajo, un mismo estándar de ingeniería. Elige la que se ajusta a tu proyecto, o
            revisa más abajo la situación que más se parece a la tuya.
          </p>
        </div>
      </Container>

      {/* cuadro descriptivo de las 4 soluciones */}
      <Container className="pb-14">
        <h2 className="kicker text-ink/55 mb-6">Nuestras soluciones</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-ink/[.14]">
          {SOLUCIONES.map((s, i) => (
            <Link
              key={s.id}
              href={`/catalogo?solucion=${s.id}`}
              className="border-r border-b border-ink/[.14] p-6 bg-white hover:bg-surface transition-colors flex flex-col"
            >
              <div className="text-[11px] font-black tracking-[.14em] text-accent mb-4">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="text-lg font-black uppercase leading-tight mb-2.5">{s.nombre}</h3>
              <p className="text-[12.5px] text-ink/60 leading-relaxed mb-4 flex-1">{s.desc}</p>
              <div className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/40 mb-3">
                {s.meta}
              </div>
              <span className="text-[11px] font-bold tracking-[.08em] uppercase text-accent-dark">
                Ver catálogo →
              </span>
            </Link>
          ))}
        </div>
      </Container>

      {/* problemas comunes */}
      <Container className="pb-10">
        <h2 className="kicker text-ink/55 mb-6">¿Cuál es tu situación?</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {PROBLEMAS.map((p, i) => (
            <div key={i} className="border border-ink/[.14] bg-white p-6 flex flex-col">
              <div className="text-[11px] font-black tracking-[.14em] text-accent-dark mb-3">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="text-lg font-black leading-snug mb-2">{p.pregunta}</h3>
              <p className="text-[12.5px] text-ink/55 leading-relaxed mb-4">{p.contexto}</p>
              <div className="mt-auto border-t border-ink/10 pt-4">
                <div className="text-[10.5px] font-medium tracking-[.12em] uppercase text-ink/45 mb-1.5">
                  Solución recomendada
                </div>
                <div className="text-sm font-bold text-ink mb-2">{p.solucionNombre}</div>
                <p className="text-[12.5px] text-ink/65 leading-relaxed mb-4">{p.recomendacion}</p>
                <Link
                  href={`/catalogo?solucion=${p.solucionId}`}
                  className="inline-block border-0 bg-ink text-white font-heading text-[11px] font-bold tracking-[.1em] uppercase px-4 py-3 hover:bg-accent-dark transition-colors"
                >
                  Ver productos para esta solución →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Container>

      <Container className="mb-14">
        <div className="bg-ink text-white p-8 sm:p-11 flex flex-wrap gap-6 items-center justify-between">
          <div className="max-w-[520px]">
            <h2 className="text-2xl sm:text-[28px] font-black uppercase leading-tight mb-3">
              ¿No identificas tu problema aquí?
            </h2>
            <p className="text-sm leading-relaxed text-white/75 m-0">
              Cuéntanos tu caso: un ingeniero de ICR revisa tu consumo o proyecto y te recomienda la solución
              adecuada.
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

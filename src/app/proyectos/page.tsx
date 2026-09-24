import type { Metadata } from 'next'
import Link from 'next/link'
import Container from '@/components/Container'
import tablero from '@/assets/tablero.jpg'
import instEquipo from '@/assets/instEquipo.jpg'
import instPanel from '@/assets/instPanel.png'
import mina from '@/assets/mina.jpg'
import almacen from '@/assets/almacen.jpg'

export const metadata: Metadata = {
  title: 'Proyectos ejecutados | Inversiones ICR',
}

const CIFRAS = [
  { valor: '12 años', etiqueta: 'Ejecutando proyectos' },
  { valor: '+4,2 MW', etiqueta: 'Potencia instalada' },
  { valor: '24 h', etiqueta: 'Respuesta técnica' },
  { valor: '14', etiqueta: 'Marcas distribuidas' },
]

const PROYECTOS = [
  {
    sector: 'Respaldo energético · Moquegua',
    nombre: 'Sistema de respaldo con baterías',
    detalle:
      'Instalación de inversor-cargador y banco de baterías LiFePO4 para continuidad de cargas críticas en Mariscal Nieto, Moquegua.',
    img: tablero,
  },
  {
    sector: 'Industria · Sur del Perú',
    nombre: 'Planta solar sobre cubierta industrial',
    detalle:
      'Montaje de gran formato sobre techo industrial con equipo de trabajo en altura certificado y protocolos de seguridad minera.',
    img: instEquipo,
  },
  {
    sector: 'Autoconsumo · Arequipa',
    nombre: 'Instalación residencial en ladera',
    detalle:
      'Sistema solar de autoconsumo para vivienda en zona periurbana, dimensionado según consumo real de la familia.',
    img: instPanel,
  },
  {
    sector: 'Off-grid · Campamento minero',
    nombre: 'Carport solar para flota vehicular',
    detalle:
      'Estructura de cochera solar que genera energía y protege la flota de vehículos en las instalaciones del cliente.',
    img: mina,
  },
  {
    sector: 'Minería · Altura',
    nombre: 'Infraestructura técnica en sitio minero',
    detalle:
      'Ingeniería eléctrica y acompañamiento técnico para instalaciones de planta y almacén en operación minera de altura.',
    img: almacen,
  },
]

export default function Proyectos() {
  return (
    <div>
      <Container className="pt-6">
        <div className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/45 mb-4">
          Inicio / <span className="text-ink">Proyectos</span>
        </div>
        <div className="flex flex-wrap gap-4 items-end justify-between border-b border-ink/[.14] pb-5 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase leading-none mb-2">Proyectos ejecutados</h1>
            <p className="text-[13px] text-ink/60 m-0 max-w-[520px]">
              Ingeniería, instalación y respaldo postventa en proyectos residenciales, comerciales e
              industriales del sur del Perú.
            </p>
          </div>
          <span className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/45">
            Arequipa · Moquegua · Cusco
          </span>
        </div>
      </Container>

      <div className="border-t border-b border-ink/[.14]">
        <Container>
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {CIFRAS.map((c) => (
              <div key={c.etiqueta} className="px-6 py-6 border-r border-ink/10 last:border-r-0">
                <div className="text-[28px] font-black leading-none">{c.valor}</div>
                <div className="text-[11px] font-medium tracking-[.12em] uppercase text-ink/55 mt-2">
                  {c.etiqueta}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      <Container className="py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROYECTOS.map((p) => (
            <div key={p.nombre} className="border border-ink/[.14] bg-white">
              <div
                className="h-[190px] bg-cover bg-center"
                style={{ backgroundImage: `url(${p.img.src})` }}
                role="img"
                aria-label={p.nombre}
              />
              <div className="p-[18px]">
                <div className="text-[11px] font-medium tracking-[.12em] uppercase text-accent-dark mb-2">
                  {p.sector}
                </div>
                <div className="text-base font-black uppercase leading-tight mb-2.5">{p.nombre}</div>
                <div className="text-xs text-ink/60 leading-relaxed">{p.detalle}</div>
              </div>
            </div>
          ))}
        </div>
      </Container>

      <Container className="mb-14">
        <div className="bg-ink text-white p-8 sm:p-11 flex flex-wrap gap-6 items-center justify-between">
          <div className="max-w-[520px]">
            <h2 className="text-2xl sm:text-[28px] font-black uppercase leading-tight mb-3">
              ¿Proyecto crítico de continuidad energética?
            </h2>
            <p className="text-sm leading-relaxed text-white/75 m-0">
              Envíanos consumos, planos o el listado de equipos. Respondemos con dimensionamiento y cotización
              en 24 horas hábiles.
            </p>
          </div>
          <Link
            href="/cotizacion"
            className="border-0 bg-accent text-ink font-heading text-xs font-black tracking-[.1em] uppercase px-7 py-4 hover:bg-accent-2 transition-colors"
          >
            Solicitar cotización técnica
          </Link>
        </div>
      </Container>
    </div>
  )
}

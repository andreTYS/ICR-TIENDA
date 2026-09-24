import Image from 'next/image'
import Link from 'next/link'
import logo from '../assets/logo.png'
import Container from './Container'

const WHATSAPP_URL = 'https://wa.me/51945103227'

const FOOTER_COLS: { titulo: string; links: { label: string; to: string; external?: boolean }[] }[] = [
  {
    titulo: 'Catálogo',
    links: [
      { label: 'Inversores', to: '/catalogo?cat=Inversor' },
      { label: 'Baterías', to: '/catalogo?cat=Batería' },
      { label: 'Paneles solares', to: '/catalogo?cat=Panel solar' },
      { label: 'Estructura', to: '/catalogo?cat=Estructura' },
      { label: 'Accesorios', to: '/catalogo?cat=Accesorios' },
    ],
  },
  {
    titulo: 'Soluciones',
    links: [
      { label: 'Respaldo energético', to: '/catalogo?solucion=respaldo' },
      { label: 'Autoconsumo en red', to: '/catalogo?solucion=autoconsumo' },
      { label: 'Sistemas off-grid', to: '/catalogo?solucion=offgrid' },
      { label: 'Monitoreo y calidad', to: '/catalogo?solucion=monitoreo' },
    ],
  },
  {
    titulo: 'Compañía',
    links: [
      { label: 'Nosotros', to: '/#nosotros' },
      { label: 'Proyectos', to: '/proyectos' },
      { label: 'Soporte técnico', to: WHATSAPP_URL, external: true },
      { label: 'Trabaja con nosotros', to: '/#empleo' },
    ],
  },
]

export default function Footer() {
  return (
    <footer id="contacto" className="bg-surface border-t border-ink/10 pt-11 pb-6">
      <Container>
        <div className="grid grid-cols-2 sm:grid-cols-[minmax(200px,1.4fr)_repeat(3,minmax(160px,1fr))] gap-8">
          <div className="col-span-2 sm:col-span-1">
            <Image src={logo} alt="ICR Inversiones" className="h-[26px] w-auto block mb-4" />
            <p className="text-[13px] leading-relaxed text-ink/65 mb-3.5 max-w-[280px]">
              Energía confiable, soluciones inteligentes. Ingeniería, componentes y respaldo para proyectos
              energéticos.
            </p>
            <div className="text-xs text-ink/60 leading-[1.8]">
              comercial@icrinversiones.pe
              <br />
              +51 945 103 227
              <br />
              Arequipa, Perú
            </div>
          </div>
          {FOOTER_COLS.map((col) => (
            <div key={col.titulo}>
              <div className="text-[10.5px] font-black tracking-[.12em] uppercase mb-3.5">{col.titulo}</div>
              <div className="flex flex-col gap-2.5">
                {col.links.map((l) =>
                  l.external ? (
                    <a
                      key={l.label}
                      href={l.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12.5px] text-ink/65 hover:text-accent-dark transition-colors"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      key={l.label}
                      href={l.to}
                      className="text-[12.5px] text-ink/65 hover:text-accent-dark transition-colors"
                    >
                      {l.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-ink/10 mt-8 pt-4 flex flex-wrap gap-3.5 justify-between text-[11px] tracking-[.06em] text-ink/45">
          <span>© 2026 Inversiones ICR · Todos los derechos reservados</span>
          <span>Términos · Privacidad · Garantías</span>
        </div>
      </Container>
    </footer>
  )
}

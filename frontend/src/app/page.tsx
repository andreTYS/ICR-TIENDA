import Link from 'next/link'
import Carousel from '@/components/Carousel'
import HeroBannerSlide from '@/components/HeroBannerSlide'
import PromoSlide, { type PromoSlideData } from '@/components/PromoSlide'
import ProductCard from '@/components/ProductCard'
import Container from '@/components/Container'
import { PRODUCTOS } from '@/data/products'
import almacen from '@/assets/almacen.jpg'
import tablero from '@/assets/tablero.jpg'

const OTHER_SLIDES: PromoSlideData[] = [
  {
    kicker: 'Promoción · Almacenamiento',
    title: 'Baterías con hasta',
    highlight: '10 años de garantía',
    desc: 'Bancos LiFePO4 para respaldo de cargas críticas ante cortes de red.',
    cta: { label: 'Ver baterías', to: '/catalogo?cat=Batería' },
    bg: `url(${almacen.src})`,
  },
  {
    kicker: 'Ingeniería ICR',
    title: 'Diseño, instalación',
    highlight: 'y respaldo postventa',
    desc: 'Un solo responsable técnico desde el dimensionamiento hasta la operación.',
    cta: { label: 'Solicitar cotización', to: '/cotizacion' },
    bg: `url(${tablero.src})`,
  },
]

export default function Home() {
  const destacados = PRODUCTOS.filter((p) => p.destacado).slice(0, 3)
  const masVendidos = [...PRODUCTOS].sort((a, b) => (b.vendidos ?? 0) - (a.vendidos ?? 0)).slice(0, 3)

  return (
    <div>
      <Carousel
        slides={[
          <HeroBannerSlide key="banner" />,
          ...OTHER_SLIDES.map((s) => <PromoSlide key={s.kicker} slide={s} />),
        ]}
      />

      <section className="py-16">
        <Container>
          <div className="flex flex-wrap gap-4 items-end justify-between mb-8">
            <div>
              <div className="text-[11px] font-bold tracking-[.2em] uppercase text-accent-dark mb-1.5">
                Selección ICR
              </div>
              <h2 className="text-3xl sm:text-4xl font-black uppercase text-ink m-0 leading-none">
                Productos destacados
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="text-xs font-bold tracking-[.1em] uppercase text-accent-dark hover:text-ink transition-colors"
            >
              Ver todo el catálogo →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destacados.map((p) => (
              <ProductCard key={p.id} p={p} size="large" />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 bg-surface">
        <Container>
          <div className="flex flex-wrap gap-4 items-end justify-between mb-8">
            <div>
              <div className="text-[11px] font-bold tracking-[.2em] uppercase text-accent-dark mb-1.5">
                Lo que más piden
              </div>
              <h2 className="text-3xl sm:text-4xl font-black uppercase text-ink m-0 leading-none">
                Productos más vendidos
              </h2>
            </div>
            <span className="text-xs font-medium tracking-[.1em] uppercase text-ink/45">
              Según pedidos de los últimos 12 meses
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {masVendidos.map((p) => (
              <ProductCard key={p.id} p={p} size="large" />
            ))}
          </div>
        </Container>
      </section>

      <section className="my-14">
        <Container>
          <div className="bg-ink text-white p-8 sm:p-11 flex flex-wrap gap-6 items-center justify-between">
            <div className="max-w-[520px]">
              <h2 className="text-2xl sm:text-[28px] font-black uppercase leading-tight mb-3">
                Explora el catálogo técnico completo
              </h2>
              <p className="text-sm leading-relaxed text-white/75 m-0">
                Inversores, baterías, paneles y estructura organizados por solución: respaldo, autoconsumo,
                off-grid/on-grid y monitoreo.
              </p>
            </div>
            <Link
              href="/catalogo"
              className="border-0 bg-accent text-ink font-heading text-xs font-black tracking-[.1em] uppercase px-7 py-4 hover:bg-accent-2 transition-colors"
            >
              Ir al catálogo completo
            </Link>
          </div>
        </Container>
      </section>
    </div>
  )
}

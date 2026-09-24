import Link from 'next/link'
import Container from './Container'

export interface PromoSlideData {
  kicker: string
  title: string
  highlight?: string
  desc: string
  cta: { label: string; to: string }
  bg: string
}

export default function PromoSlide({ slide }: { slide: PromoSlideData }) {
  return (
    <div className="relative bg-ink text-white overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: slide.bg }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(100deg,#00004c 8%,rgba(0,0,76,.86) 46%,rgba(0,0,115,.35) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,183,194,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(0,183,194,.14) 1px,transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <Container className="relative pt-16 sm:pt-20 pb-20 sm:pb-24">
        <div className="max-w-[620px]">
          <div className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[.16em] uppercase text-accent mb-5">
            <span className="w-6 h-px bg-accent block" />
            {slide.kicker}
          </div>
          <h1 className="text-4xl sm:text-[52px] leading-[.98] font-black tracking-tight mb-5 uppercase">
            {slide.title}
            {slide.highlight && <span className="text-accent-2"> {slide.highlight}</span>}
          </h1>
          <p className="text-base leading-relaxed text-white/80 mb-7">{slide.desc}</p>
          <Link
            href={slide.cta.to}
            className="inline-block border-0 bg-accent text-ink font-heading text-xs font-black tracking-[.1em] uppercase px-6 py-4 hover:bg-accent-2 transition-colors"
          >
            {slide.cta.label}
          </Link>
        </div>
      </Container>
    </div>
  )
}

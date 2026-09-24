'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import logo from '../assets/logo.png'
import { useQuote } from '../context/QuoteContext'
import { useAuth } from '../context/AuthContext'
import { SOLUCIONES } from '../data/products'
import Container from './Container'

const NAV_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Tienda' },
  { to: '/soluciones', label: 'Soluciones' },
  { to: '/proyectos', label: 'Proyectos' },
]

const WHATSAPP_URL = 'https://wa.me/51945103227'

export default function Header() {
  const { count } = useQuote()
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(query.trim() ? `/catalogo?q=${encodeURIComponent(query.trim())}` : '/catalogo')
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_rgba(0,0,76,.08)]">
      {/* utility bar */}
      <div className="bg-ink text-white/70 text-[11px] font-medium tracking-[.1em] uppercase py-2">
        <Container className="flex flex-wrap gap-4 justify-between items-center">
          <span>Arequipa, Perú · Ingeniería energética para proyectos industriales y residenciales</span>
          <div className="flex gap-4 sm:gap-[18px] items-center">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline hover:text-white transition-colors"
            >
              Soporte técnico
            </a>
            <Link href={user ? '/perfil' : '/login'} className="text-accent hover:text-accent-2 transition-colors">
              {user ? user.nombre.split(' ')[0] : 'Iniciar sesión'}
            </Link>
          </div>
        </Container>
      </div>

      {/* header */}
      <div className="border-b border-ink/10 py-4">
        <Container className="flex flex-wrap gap-5 items-center justify-between">
          <Link href="/" className="flex items-center shrink-0">
            <Image src={logo} alt="ICR Inversiones" className="h-7 w-auto block" priority />
          </Link>

          <nav className="flex flex-wrap gap-4 sm:gap-[22px] text-xs font-medium tracking-[.08em] uppercase order-3 w-full sm:order-none sm:w-auto">
            {NAV_LINKS.map((l) => {
              const isActive = l.to === '/' ? pathname === '/' : pathname.startsWith(l.to)
              return (
                <Link
                  key={l.to}
                  href={l.to}
                  className={isActive ? 'text-accent' : 'text-ink hover:text-accent transition-colors'}
                >
                  {l.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex gap-2.5 items-center">
            <form
              onSubmit={onSearch}
              className="hidden md:flex items-center gap-2 border border-ink/20 px-3 py-2 min-w-[200px]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00004c" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Referencia, marca o kW"
                className="text-xs text-ink placeholder:text-ink/40 outline-none bg-transparent w-full"
              />
            </form>
            <Link
              href="/cotizacion"
              className="border-0 bg-ink text-white font-heading text-[11px] font-bold tracking-[.1em] uppercase px-4 py-[11px] flex gap-2 items-center hover:bg-accent-dark transition-colors"
            >
              Cotización
              <span className="bg-accent text-ink font-black px-1.5 min-w-[16px] text-center">{count}</span>
            </Link>
          </div>
        </Container>
      </div>

      {/* solution bar */}
      <div className="bg-surface border-b border-ink/10">
        <Container className="flex flex-wrap justify-center gap-x-8 overflow-x-auto">
          {SOLUCIONES.map((s) => (
            <Link
              key={s.id}
              href={`/catalogo?solucion=${s.id}`}
              className="text-[11px] font-medium tracking-[.1em] uppercase text-ink py-[13px] border-b-2 border-transparent hover:border-accent whitespace-nowrap transition-colors"
            >
              {s.nombre}
            </Link>
          ))}
        </Container>
      </div>
    </header>
  )
}

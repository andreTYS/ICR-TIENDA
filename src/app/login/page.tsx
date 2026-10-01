'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Container from '@/components/Container'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { user, ready, login } = useAuth()
  const router = useRouter()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ready && user) router.replace('/perfil')
  }, [ready, user, router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      await login(correo, password)
      router.push('/perfil')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Correo o contraseña incorrectos')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Container className="pt-6 pb-20">
      <div className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/45 mb-4">
        Inicio / <span className="text-ink">Iniciar sesión</span>
      </div>

      <div className="max-w-[420px] mx-auto py-10">
        <h1 className="text-3xl font-black uppercase leading-none mb-2 text-center">Iniciar sesión</h1>
        <p className="text-[13px] text-ink/60 text-center mb-8">
          Accede a tus cotizaciones, pedidos y datos de proyecto.
        </p>

        <form onSubmit={onSubmit} className="border border-ink/[.14] p-6 flex flex-col gap-4">
          <div>
            <div className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/50 mb-1.5">
              Correo electrónico
            </div>
            <input
              required
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="nombre@empresa.com"
              className="w-full border border-ink/20 px-3 py-2.5 text-[13px] text-ink placeholder:text-ink/40 outline-none focus:border-accent"
            />
          </div>
          <div>
            <div className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/50 mb-1.5">
              Contraseña
            </div>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-ink/20 px-3 py-2.5 text-[13px] text-ink placeholder:text-ink/40 outline-none focus:border-accent"
            />
          </div>
          {error && <p className="text-[12.5px] text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="border-0 bg-ink text-white font-heading text-xs font-black tracking-[.1em] uppercase px-4 py-4 mt-2 hover:bg-accent-dark transition-colors disabled:opacity-60"
          >
            {enviando ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="text-center mt-6 text-[13px] text-ink/65">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-accent-dark font-bold hover:underline">
            Regístrate
          </Link>
        </div>
      </div>
    </Container>
  )
}

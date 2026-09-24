'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Container from '@/components/Container'
import { useAuth } from '@/context/AuthContext'

const CAMPOS = [
  { key: 'nombre', label: 'Nombre completo', ph: 'Juan Pérez', type: 'text', required: true },
  { key: 'correo', label: 'Correo electrónico', ph: 'nombre@empresa.com', type: 'email', required: true },
  { key: 'empresa', label: 'Empresa (opcional)', ph: 'Inversiones ejemplo S.A.C.', type: 'text', required: false },
  { key: 'telefono', label: 'Teléfono (opcional)', ph: '945 103 227', type: 'tel', required: false },
] as const

export default function Registro() {
  const { user, ready, register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string>>({})
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (ready && user) router.replace('/perfil')
  }, [ready, user, router])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    register({
      nombre: form.nombre ?? '',
      correo: form.correo ?? '',
      empresa: form.empresa || undefined,
      telefono: form.telefono || undefined,
    })
    router.push('/perfil')
  }

  return (
    <Container className="pt-6 pb-20">
      <div className="text-[11px] font-medium tracking-[.1em] uppercase text-ink/45 mb-4">
        Inicio / <span className="text-ink">Crear cuenta</span>
      </div>

      <div className="max-w-[460px] mx-auto py-10">
        <h1 className="text-3xl font-black uppercase leading-none mb-2 text-center">Crear cuenta</h1>
        <p className="text-[13px] text-ink/60 text-center mb-8">
          Guarda tus datos de proyecto para cotizar y comprar más rápido.
        </p>

        <form onSubmit={onSubmit} className="border border-ink/[.14] p-6 flex flex-col gap-4">
          {CAMPOS.map((c) => (
            <div key={c.key}>
              <div className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/50 mb-1.5">
                {c.label}
              </div>
              <input
                required={c.required}
                type={c.type}
                value={form[c.key] ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
                placeholder={c.ph}
                className="w-full border border-ink/20 px-3 py-2.5 text-[13px] text-ink placeholder:text-ink/40 outline-none focus:border-accent"
              />
            </div>
          ))}
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
          <button
            type="submit"
            className="border-0 bg-accent text-ink font-heading text-xs font-black tracking-[.1em] uppercase px-4 py-4 mt-2 hover:bg-accent-2 transition-colors"
          >
            Crear cuenta
          </button>
          <div className="text-[11px] text-ink/45 leading-relaxed text-center">
            Cuenta de demostración: la autenticación real se conectará al backend próximamente.
          </div>
        </form>

        <div className="text-center mt-6 text-[13px] text-ink/65">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-accent-dark font-bold hover:underline">
            Inicia sesión
          </Link>
        </div>
      </div>
    </Container>
  )
}

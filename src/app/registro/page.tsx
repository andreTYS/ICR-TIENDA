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
  {
    key: 'ruc',
    label: 'RUC o DNI (opcional)',
    ph: '20123456789',
    type: 'text',
    required: false,
  },
] as const

export default function Registro() {
  const { user, ready, register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string>>({})
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
    const rucODni = (form.ruc ?? '').trim()
    try {
      await register({
        nombre: form.nombre ?? '',
        correo: form.correo ?? '',
        password,
        empresa: form.empresa || undefined,
        telefono: form.telefono || undefined,
        // Un RUC real tiene 11 dígitos; cualquier otra cosa (DNI, 8 dígitos)
        // se manda como dni — así el mismo campo del formulario sirve para
        // ambos, igual que en el resto del ERP.
        ruc: /^\d{11}$/.test(rucODni) ? rucODni : undefined,
        dni: rucODni && !/^\d{11}$/.test(rucODni) ? rucODni : undefined,
      })
      router.push('/perfil')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta')
    } finally {
      setEnviando(false)
    }
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
              {c.key === 'ruc' && (
                <p className="text-[11px] text-ink/45 mt-1">
                  Si coincide con un cliente ya registrado en ICR, vas a ver tus cotizaciones y contratos en &quot;Mi
                  perfil&quot;.
                </p>
              )}
            </div>
          ))}
          <div>
            <div className="text-[10.5px] font-medium tracking-[.1em] uppercase text-ink/50 mb-1.5">
              Contraseña
            </div>
            <input
              required
              minLength={6}
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
            className="border-0 bg-accent text-ink font-heading text-xs font-black tracking-[.1em] uppercase px-4 py-4 mt-2 hover:bg-accent-2 transition-colors disabled:opacity-60"
          >
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
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

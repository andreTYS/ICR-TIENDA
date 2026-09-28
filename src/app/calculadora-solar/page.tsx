import { Suspense } from 'react'
import type { Metadata } from 'next'
import CalculadoraSolarClient from './CalculadoraSolarClient'

export const metadata: Metadata = {
  title: 'Calculadora solar | Inversiones ICR',
  description:
    'Calcula en segundos cuántos paneles, qué inversor y qué banco de baterías necesitas según tu recibo de luz, con equipos reales de nuestro catálogo.',
}

export default function CalculadoraSolarPage() {
  return (
    <Suspense fallback={null}>
      <CalculadoraSolarClient />
    </Suspense>
  )
}

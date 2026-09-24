import { Suspense } from 'react'
import type { Metadata } from 'next'
import CatalogoClient from './CatalogoClient'

export const metadata: Metadata = {
  title: 'Catálogo técnico | Inversiones ICR',
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={null}>
      <CatalogoClient />
    </Suspense>
  )
}

'use client'

import { useState } from 'react'

// Las fotos se sirven desde /uploads del backend (mismo dominio). Se usa <img>
// directo en vez de next/image: son archivos ya optimizados y el optimizador
// de Next no puede alcanzar /uploads, que Traefik enruta a otro contenedor.
export default function ProductImage({
  src,
  alt,
  className = '',
}: {
  src: string | null
  alt: string
  className?: string
}) {
  const [error, setError] = useState(false)
  if (!src || error) {
    return (
      <div className="font-medium tracking-[.14em] uppercase text-ink/30 text-center leading-relaxed text-[10px]">
        Imagen de
        <br />
        producto
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setError(true)}
      className={`max-w-full max-h-full object-contain mix-blend-multiply ${className}`}
    />
  )
}

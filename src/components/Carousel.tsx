'use client'

import { useEffect, useState, type ReactNode } from 'react'

export default function Carousel({ slides }: { slides: ReactNode[] }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive((i) => (i + 1) % slides.length), 6000)
    return () => clearInterval(t)
  }, [slides.length])

  return (
    <div className="relative">
      {slides[active]}

      <div className="absolute right-4 sm:right-6 top-4 sm:top-5 z-10 flex gap-2 bg-ink/35 backdrop-blur px-3 py-2 rounded-full">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir a la promoción ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${i === active ? 'w-8 bg-accent' : 'w-1.5 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  )
}

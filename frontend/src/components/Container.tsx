import type { ReactNode } from 'react'

export default function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 ${className}`}>{children}</div>
}

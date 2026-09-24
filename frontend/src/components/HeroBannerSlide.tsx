import Image from 'next/image'
import Link from 'next/link'
import banner from '../assets/banner-paneles-solares.jpeg'

export default function HeroBannerSlide() {
  return (
    <Link href="/catalogo?cat=Panel solar" className="block relative">
      <Image
        src={banner}
        alt="Los mejores paneles solares para tu proyecto - Alta calidad - Cotiza al 945 103 227"
        className="w-full h-auto block"
        priority
      />
    </Link>
  )
}

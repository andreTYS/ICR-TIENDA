import type { Metadata } from 'next'
import { QuoteProvider } from '@/context/QuoteContext'
import { AuthProvider } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inversiones ICR | Energía solar y respaldo energético',
  description:
    'Ingeniería energética, paneles solares, baterías e inversores para proyectos residenciales e industriales en el sur del Perú.',
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <QuoteProvider>
            <div className="min-h-screen flex flex-col bg-white">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </QuoteProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

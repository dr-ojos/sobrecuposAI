// app/layout.tsx
import { Metadata } from 'next'
import './globals.css'
import 'react-datepicker/dist/react-datepicker.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Sobrecupos AI',
  description: 'Sistema de gestión de sobrecupos médicos',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
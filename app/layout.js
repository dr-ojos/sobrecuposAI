// app/layout.js
import './globals.css'
import 'react-datepicker/dist/react-datepicker.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Sobrecupos AI',
  description: 'Sistema de gestión de sobrecupos médicos',
}

export default function RootLayout({ children }) {
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
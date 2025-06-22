// app/layout.js
import './globals.css'
import 'react-datepicker/dist/react-datepicker.css'
// …

export const metadata = {
  title: 'Admin Panel',
  description: 'Carga de horarios para Airtable',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}

import { withAuth } from "next-auth/middleware"
import { NextRequest } from "next/server"

export default withAuth(
  function middleware(req: NextRequest) {
    // Aquí puedes agregar lógica adicional si necesitas
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

// Proteger todas las rutas que empiecen con /medico
export const config = { matcher: ["/medico/:path*"] }
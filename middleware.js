import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
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
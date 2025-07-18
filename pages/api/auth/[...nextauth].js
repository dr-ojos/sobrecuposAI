import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export default NextAuth({
  providers: [
    // Login con Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),
    
    // Login con usuario/clave
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Buscar médico en Airtable por email
          const res = await fetch(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_DOCTORS_TABLE}?filterByFormula={Email}="${credentials.email}"`,
            {
              headers: {
                Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
              },
            }
          );
          
          const data = await res.json();
          const doctor = data.records?.[0];
          
          if (doctor && doctor.fields?.Password === credentials.password) {
            return {
              id: doctor.id,
              email: doctor.fields.Email,
              name: doctor.fields.Name,
              doctorData: doctor.fields
            };
          }
          
          return null;
        } catch (error) {
          console.error("Error en autenticación:", error);
          return null;
        }
      }
    })
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          // Verificar si el médico existe en Airtable
          const res = await fetch(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_DOCTORS_TABLE}?filterByFormula={Email}="${user.email}"`,
            {
              headers: {
                Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
              },
            }
          );
          
          const data = await res.json();
          const doctor = data.records?.[0];
          
          if (doctor) {
            // Médico existe, permitir login
            user.doctorId = doctor.id;
            user.doctorData = doctor.fields;
            return true;
          } else {
            // Médico no registrado
            return false;
          }
        } catch (error) {
          console.error("Error verificando médico:", error);
          return false;
        }
      }
      
      return true;
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.doctorId = user.doctorId || user.id;
        token.doctorData = user.doctorData;
      }
      return token;
    },
    
    async session({ session, token }) {
      session.user.doctorId = token.doctorId;
      session.user.doctorData = token.doctorData;
      return session;
    }
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  
  session: {
    strategy: "jwt",
  },
});
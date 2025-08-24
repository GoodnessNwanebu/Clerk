import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { prisma } from "../../../../lib/database/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"

const handler = NextAuth({
  session: { strategy: "jwt" },
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 SignIn callback triggered:', { 
        userEmail: user.email, 
        userName: user.name,
        provider: account?.provider 
      });
      return true;
    },
    async jwt({ token, account, profile }) {
      console.log('🎫 JWT callback triggered:', { 
        tokenEmail: token.email,
        hasAccount: !!account 
      });
      
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      console.log('📋 Session callback triggered:', { 
        sessionEmail: session.user?.email,
        tokenEmail: token.email 
      });
      
      return session
    },
  },
  secret: process.env.AUTH_SECRET,
  debug: true, // Enable debug mode
})

export { handler as GET, handler as POST }

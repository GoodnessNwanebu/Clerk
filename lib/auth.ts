import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { prisma } from "./database/prisma"

export const { auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
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
      
      // Manually create/update user in database
      if (user.email) {
        try {
          const dbUser = await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name || undefined,
              image: user.image || undefined,
            },
            create: {
              email: user.email,
              name: user.name || undefined,
              image: user.image || undefined,
            },
          });
          console.log('✅ User created/updated in database:', dbUser.id);
        } catch (error) {
          console.error('❌ Error creating/updating user:', error);
        }
      }
      
      return true;
    },
    async jwt({ token, account, profile }) {
      console.log('🎫 JWT callback triggered:', { 
        tokenEmail: token.email,
        hasAccount: !!account 
      });
      
      // Persist the OAuth access_token and or the user id to the token right after signin
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
      
      // You can add custom properties to session here if needed
      return session
    },
  },
  secret: process.env.AUTH_SECRET,
  debug: true, // Enable debug mode
})

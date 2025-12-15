/**
 * Complete NextAuth Configuration
 * Full authentication setup for Settler.dev
 * TODO: Install next-auth package: npm install next-auth @next-auth/prisma-adapter
 */

// TODO: Uncomment when next-auth is installed
// import { NextAuthOptions } from 'next-auth';
// import CredentialsProvider from 'next-auth/providers/credentials';
// import { PrismaAdapter } from '@next-auth/prisma-adapter';
// import { prisma } from '@/lib/db/prisma-analytics';
// import bcrypt from 'bcrypt';

// Temporary type definition
type NextAuthOptions = any;

// TODO: Uncomment and configure when next-auth is installed
export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma),
  providers: [
    // CredentialsProvider({
    //   name: 'Credentials',
    //   credentials: {
    //     email: { label: 'Email', type: 'email' },
    //     password: { label: 'Password', type: 'password' },
    //   },
    //   async authorize(credentials: any) {
    //     if (!credentials?.email || !credentials?.password) {
    //       return null;
    //     }

    //     // TODO: Implement user lookup from your user table
    //     // const user = await prisma.user.findUnique({
    //     //   where: { email: credentials.email },
    //     // });
    //     //
    //     // if (!user || !user.password) {
    //     //   return null;
    //     // }
    //     //
    //     // const isValid = await bcrypt.compare(credentials.password, user.password);
    //     // if (!isValid) {
    //     //   return null;
    //     // }
    //     //
    //     // return {
    //     //   id: user.id,
    //     //   email: user.email,
    //     //   name: user.name,
    //     //   roles: user.roles || [],
    //     // };

    //     // Placeholder - replace with actual user lookup
    //     return null;
    //   },
    // }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/signup',
    error: '/signup',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.roles = (user as any).roles || [];
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).roles = token.roles || [];
      }
      return session;
    },
  },
  events: {
    async signIn({ user, isNewUser }: any) {
      // Track sign-in analytics
      const { saveAnalyticsEvent } = await import('@/lib/db/prisma-analytics');
      await saveAnalyticsEvent({
        type: 'user_signin',
        data: {
          userId: user.id,
          isNewUser,
        },
        userId: user.id,
      });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

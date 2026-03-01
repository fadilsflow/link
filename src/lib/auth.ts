import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'
import * as schema from '@/db/schema'

const trustedOrigins = [process.env.BETTER_AUTH_URL].filter(
  (origin): origin is string => typeof origin === 'string' && origin.length > 0,
)

export const auth = betterAuth({
  appName: 'Kreeasi',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  experimental: {
    joins: true,
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
      strategy: 'jwe',
    },
  },
  trustedOrigins,
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      username: {
        type: 'string',
        required: false,
      },
      bio: {
        type: 'string',
        required: false,
      },
      title: {
        type: 'string',
        required: false,
      },
    },
  },
  plugins: [tanstackStartCookies()],
})

import { cache } from 'react'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from './auth'

type CachedSessionEntry = {
  expiresAt: number
  session: Awaited<ReturnType<typeof auth.api.getSession>>
}

const SESSION_CACHE_TTL_MS = 15_000
const sessionCache = new Map<string, CachedSessionEntry>()

function getSessionCacheKey(headers: Headers) {
  const cookie = headers.get('cookie') ?? ''
  const authHeader = headers.get('authorization') ?? ''
  return `${cookie}::${authHeader}`
}

function pruneExpiredSessionCache(now = Date.now()) {
  for (const [key, value] of sessionCache.entries()) {
    if (value.expiresAt <= now) {
      sessionCache.delete(key)
    }
  }
}

export async function getSessionFromHeaders(headers: Headers) {
  const cacheKey = getSessionCacheKey(headers)

  if (!cacheKey || cacheKey === '::') {
    return await auth.api.getSession({ headers })
  }

  const now = Date.now()
  const cached = sessionCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return cached.session
  }

  const session = await auth.api.getSession({ headers })

  if (sessionCache.size > 300) {
    pruneExpiredSessionCache(now)
    if (sessionCache.size > 300) {
      const firstKey = sessionCache.keys().next().value
      if (firstKey) {
        sessionCache.delete(firstKey)
      }
    }
  }

  sessionCache.set(cacheKey, {
    session,
    expiresAt: now + SESSION_CACHE_TTL_MS,
  })

  return session
}

export const getServerSession = cache(async () => {
  const request = getRequest()
  return await getSessionFromHeaders(request.headers)
})

export const getServerAuthContext = cache(async () => {
  const session = await getServerSession()

  if (!session || !session.user.id) {
    return {
      isAuthenticated: false as const,
      session: null,
      user: null,
    }
  }

  return {
    isAuthenticated: true as const,
    session,
    user: session.user,
  }
})

export const getAdminAccessForUsername = cache(async (username: string) => {
  const authContext = await getServerAuthContext()

  if (!authContext.isAuthenticated || !authContext.user.username) {
    return {
      ok: false as const,
      reason: 'UNAUTHENTICATED' as const,
    }
  }

  if (authContext.user.username !== username) {
    return {
      ok: false as const,
      reason: 'WRONG_OWNER' as const,
      expectedUsername: authContext.user.username,
    }
  }

  return {
    ok: true as const,
    user: authContext.user,
    session: authContext.session,
  }
})

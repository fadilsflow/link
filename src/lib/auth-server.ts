import { getRequest } from '@tanstack/react-start/server'
import { auth } from './auth'

export async function getServerSession() {
  const request = getRequest()
  if (!request) return null
  return await auth.api.getSession({
    headers: request.headers,
  })
}

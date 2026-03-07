const RESERVED_USERNAMES = [
  'admin',
  'dashboard',
  'onboarding',
  'login',
  'register',
  'auth',
  'api',
  'd',
  'cart',
]

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.includes(username.trim().toLowerCase())
}

export function getReservedUsernameError(username: string): string | null {
  return isReservedUsername(username)
    ? 'Username ini tidak bisa digunakan. Pilih username lain.'
    : null
}

export { RESERVED_USERNAMES }

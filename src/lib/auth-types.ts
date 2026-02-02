import { auth } from './auth'

export type Session = typeof auth.$Infer.Session.session & {
  user: typeof auth.$Infer.Session.user & {
    username?: string | null
  }
}

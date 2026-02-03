import { Link } from '@tanstack/react-router'
import UserButton from './UserButton'
import { LoginModal } from '@/components/LoginModal'
import { authClient } from '@/lib/auth-client'

export const Header = () => {
  const { data: session, isPending } = authClient.useSession()

  return (
    <header>
      <nav className="fixed z-20 w-full bg-background border-b border-border/64">
        <div className="mx-auto max-w-6xl px-4 py-2 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="-mt-0.5 flex shrink-0 items-center gap-1.5 font-heading font-semibold text-2xl sm:text-[1.625em]">
              <Link aria-label="Home" to="/">
                Link.com
              </Link>
            </div>

            {/* Right section — always mounted */}
            <div className="flex items-center min-h-[40px]">
              {isPending ? null : session?.user ? (
                <UserButton />
              ) : (
                <LoginModal />
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

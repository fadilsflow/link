import { LoginModal } from '@/components/LoginModal'
import { Link } from '@tanstack/react-router'
import { LogoType } from './Logo'
import { authClient } from '@/lib/auth-client'
import { Spinner } from './ui/spinner'
import UserButton from './UserButton'

export const Header = () => {
  const { data: session, isPending } = authClient.useSession()

  return (
    <header>
      <nav className="fixed z-20 w-full bg-background">
        <div className="mx-auto max-w-6xl px-4 py-2 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to="/" aria-label="home" className="flex items-center">
              <LogoType />
            </Link>

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

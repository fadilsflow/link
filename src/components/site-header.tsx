import { Link } from '@tanstack/react-router'
import UserButton from './user-button'
import { LoginModal } from '@/components/login-modal'
import { authClient } from '@/lib/auth-client'

export const Header = () => {
  const { data: session, isPending } = authClient.useSession()

  return (
    <header className="sticky top-0 z-40 w-full bg-background  before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border/64">
      <nav
        // data-state={menuState && "active"}
        className={'w-full transition-all duration-300'}
      >
        <div className="container py-4">
          <div className="flex flex-wrap items-center justify-between gap-6  lg:gap-0">
            <div className="-mt-0.5 flex shrink-0 items-center gap-1.5 font-heading font-semibold   sm:text-2xl sm:text-[1.625em]">
              <Link aria-label="Home" to="/">
                Karya.top
              </Link>
            </div>

            {/* Right section — always mounted */}
            <div className="flex items-center ">
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

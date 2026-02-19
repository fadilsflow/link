import { Link } from '@tanstack/react-router'
import UserButton from './user-button'
import { authClient } from '@/lib/auth-client'
import { Button } from './ui/button'
import { GitHub } from './icon/github'
import { REPO_URL } from '@/lib/constans'

export const Header = () => {
  const { data: session, isPending } = authClient.useSession()

  return (
    <header className="sticky top-0 z-40 w-full bg-background  before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border/64">
      <nav
        className={'container w-full transition-all duration-300'}
      >
        <div className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-6  lg:gap-0">
            <div className="flex items-center gap-6">
              <Link className="-mt-0.5 flex shrink-0 items-center gap-1.5 font-heading font-semibold  text-2xl " aria-label="Home" to="/">
                kreasi.top
              </Link>
            </div>
            {/* Right section — always mounted */}
            <div className="flex items-center gap-6 ">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size='sm' render={<a href={REPO_URL} target='_blank' />} className="rounded-full hidden md:flex justify-center ">
                  <GitHub className='invert' />5.3K
                </Button>
              </div>
              {isPending ? null : session?.user ? (
                <UserButton />
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant='outline' size='sm' render={<Link to='/login' />}>Log in</Button>
                  <Button variant='default' size='sm' render={<Link to='/register' />}>Sign Up</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

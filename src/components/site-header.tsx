import { Link } from '@tanstack/react-router'
import UserButton from './user-button'
import { LoginModal } from '@/components/login-modal'
import { authClient } from '@/lib/auth-client'
import { Button } from './ui/button'
import { GitHub } from './icon/github'
import { Star } from 'lucide-react'
import { REPO_URL } from '@/lib/constans'

export const Header = () => {
  const { data: session, isPending } = authClient.useSession()
  const nav = [
    {
      name: 'Discover',
      href: '/',
    },
    {
      name: 'Pricing',
      href: '/',
    },
    {
      name: 'Developer',
      href: '/',
    }
  ]

  return (
    <header className="sticky top-0 z-40 w-full bg-background  before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border/64">
      <nav
        // data-state={menuState && "active"}
        className={'w-full transition-all duration-300'}
      >
        <div className="container py-4">
          <div className="flex flex-wrap items-center justify-between gap-6  lg:gap-0">
            <div className="flex items-center gap-6">
              <Link className="mt-0.5 flex shrink-0 items-center gap-1.5 font-heading font-semibold   sm:text-2xl sm:text-[1.625em]" aria-label="Home" to="/">
                Kreasi
              </Link>
              <Button variant="outline" render={<a href={REPO_URL} target='_blank' />} className="rounded-full flex justify-center "><GitHub className='invert' />5.3K <Star className='fill-current' /></Button>
            </div>

            {/* Right section — always mounted */}
            <div className="flex items-center gap-6 ">
              <div className="flex items-center gap-2">
                {nav.map((item) => (
                  <Button variant="ghost" render={<Link to={item.href} />} key={item.name} >
                    {item.name}
                  </Button>
                ))
                }
              </div>
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

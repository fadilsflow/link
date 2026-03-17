import { Link } from '@tanstack/react-router'
import { COMPANY_NAME } from '@/lib/constans'

export function SiteFooter() {
  return (
    <footer className="relative py-6 text-muted-foreground ">
      <div className="container mx-auto flex w-full items-center justify-center gap-2 px-4 sm:px-6">
        <p>
          © {new Date().getFullYear()}{' '}
          <Link className="font-heading text-foreground text-lg" to="/">
            {COMPANY_NAME}
          </Link>{' '}
          •{' '}
          <Link className="underline" to="/tos">
            Terms of Service
          </Link>
        </p>
      </div>
    </footer>
  )
}

import { Link } from '@tanstack/react-router'

import { COMPANY_NAME } from '@/lib/constans'

export default function PublicMark() {
  return (
    <div className="container mx-auto flex w-full items-center justify-center gap-2 px-4 sm:px-6">
      <p>
        © {new Date().getFullYear()}{' '}
        <Link className="font-heading text-foreground text-lg" to="/">
          {COMPANY_NAME}
        </Link>{' '}
        – open source, open heart, open mind.
      </p>
    </div>
  )
}

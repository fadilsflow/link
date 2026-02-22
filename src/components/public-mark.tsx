import { Link } from '@tanstack/react-router'

import { COMPANY_NAME } from '@/lib/constans'

interface PublicMarkProps {
  textColor?: string
}

export default function PublicMark({ textColor }: PublicMarkProps) {
  return (
    <div className="container mx-auto flex w-full items-center justify-center gap-2 px-4 sm:px-6">
      <p style={{ color: textColor }}>
        © {new Date().getFullYear()}{' '}
        <Link className="font-heading text-lg" to="/" style={{ color: textColor }}>
          {COMPANY_NAME}
        </Link>{' '}
        – open source, open heart, open mind.
      </p>
    </div>
  )
}

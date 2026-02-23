import { Link } from '@tanstack/react-router'
import { LogoType } from './kreasi-logo'

interface PublicMarkProps {
  textColor?: string
  logoColor?: string
}

export default function PublicMark({ textColor, logoColor }: PublicMarkProps) {
  return (
    <div className="flex w-full font-sans  items-center justify-center px-4 sm:px-6">
      <div className='flex gap-3 items-center'>
        <p style={{ color: textColor }} className="text-sm">
          Powered by{" "}
        </p>
        <Link className="font-heading" to="/" style={{ color: textColor }}>
          <LogoType style={{ color: logoColor }} />
        </Link>
      </div>
    </div >
  )
}

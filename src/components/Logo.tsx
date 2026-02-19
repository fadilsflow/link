import { cn } from '@/lib/utils'
// import Image from "next/image";

const LogoMark = ({ className }: { className?: string }) => {
  return (
    <img
      src="/logo-black.svg"
      alt=""
      width={24}
      height={24}
      className={cn(className)}
    />
  )
}

const LogoType = ({ className }: { className?: string }) => {
  return (
    <div className={cn('flex items-center text-xl font-medium', className)}>
      {/* <img
        src="/logo-color.svg"
        alt=""
        width={24}
        height={24}
        className={cn(className)}
      /> */}
      <span className="font-heading text-2xl font-bold text-foreground">
        kreasi.top
      </span>
    </div>
  )
}

export { LogoMark, LogoType }

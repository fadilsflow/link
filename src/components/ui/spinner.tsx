// import { Loader2Icon } from 'lucide-react'
import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// function Spinner({
//   className,
//   ...props
// }: React.ComponentProps<typeof Loader2Icon>) {
//   return (
//     <Loader2Icon
//       aria-label="Loading"
//       className={cn('animate-spin', className)}
//       role="status"
//       {...props}
//     />
//   )
// }

const Spinner = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  function Spinner({ color = 'primary', className, ...props }, ref) {
    return (
      <svg
        ref={ref}
        className={cn(
          'mx-4 h-5 w-5 animate-spin',
          color === 'primary' ? 'text-inverted' : 'text-muted',
          className,
        )}
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    )
  },
)

export { Spinner }

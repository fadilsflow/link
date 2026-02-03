import { CheckCircle2, Loader2, XCircle, CircleDashed } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export type SyncStatus = 'saved' | 'saving' | 'unsaved' | 'error'

interface StatusBadgeProps {
  status?: SyncStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!status) {
      setIsVisible(false)
      return
    }

    if (status === 'saved') {
      setIsVisible(true)
      const timer = setTimeout(() => setIsVisible(false), 3000)
      return () => clearTimeout(timer)
    }

    setIsVisible(true)
  }, [status])

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center transition-all duration-500 overflow-hidden',
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-1">
        {status === 'saved' && (
          <>
            <div className="p-1 bg-emerald-50 rounded-full border border-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest whitespace-nowrap">
              Saved
            </span>
          </>
        )}
        {status === 'saving' && (
          <>
            <div className="p-1 bg-blue-50 rounded-full border border-blue-100">
              <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
            </div>
            <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest whitespace-nowrap">
              Saving
            </span>
          </>
        )}
        {status === 'unsaved' && (
          <>
            <div className="p-1 bg-amber-50 rounded-full border border-amber-100">
              <CircleDashed className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            </div>
            <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest whitespace-nowrap">
              Syncing
            </span>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="p-1 bg-red-50 rounded-full border border-red-100">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
            </div>
            <span className="text-[8px] font-black text-red-600 uppercase tracking-widest whitespace-nowrap">
              Error
            </span>
          </>
        )}
      </div>
    </div>
  )
}

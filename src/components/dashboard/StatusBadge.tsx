import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export type SyncStatus = 'saved' | 'saving' | 'unsaved' | 'error'

interface StatusBadgeProps {
  status?: SyncStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (status === 'saved') {
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(timer)
    }
    setShowSaved(true)
  }, [status])

  // Don't show anything if status is undefined
  if (!status) {
    return <div className={cn('w-24 border-l border-border/30', className)} />
  }

  const isVisible =
    status === 'saving' ||
    status === 'unsaved' ||
    status === 'error' ||
    (status === 'saved' && showSaved)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 transition-all duration-300',
        status === 'saved' && isVisible && 'bg-emerald-50/30 opacity-100',
        status === 'saved' &&
          !isVisible &&
          'bg-transparent opacity-0 w-0 border-none',
        status === 'saving' && 'bg-zinc-50/50 opacity-100',
        (status === 'unsaved' || status === 'error') &&
          'bg-amber-50/30 opacity-100',
        className,
      )}
    >
      {status === 'saved' && isVisible && (
        <>
          <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-in fade-in zoom-in duration-300" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
            Saved
          </span>
        </>
      )}
      {status === 'saving' && (
        <>
          <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
            Saving
          </span>
        </>
      )}
      {(status === 'unsaved' || status === 'error') && (
        <>
          <XCircle className="h-5 w-5 text-amber-500" />
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">
            Unsaved
          </span>
        </>
      )}
    </div>
  )
}

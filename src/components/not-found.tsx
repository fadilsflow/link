import { Link } from '@tanstack/react-router'
import { Home, Lock, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        <div className="relative flex items-center justify-center w-24 h-24 bg-muted/30 rounded-2xl mb-2">
          {/* Document shape hint */}
          <div className="absolute inset-4 border border-border/40 rounded-lg bg-background" />
          {/* Lock Icon */}
          <div className="relative z-10 p-3 bg-emerald-50 rounded-xl">
            <div className="bg-emerald-500 rounded-md p-1">
              <Lock className="w-6 h-6 text-white leading-none" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Oops! Something went wrong!
        </h1>

        <div className="flex items-center gap-3 w-full justify-center mt-2">
          <Button className={'min-w-[140px]'} render={<Link to="/" />}>
            <Home />
            Home
          </Button>

          <Button
            onClick={() => window.location.reload()}
            variant={'outline'}
            className={'min-w-[140px]'}
          >
            <RefreshCw />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}

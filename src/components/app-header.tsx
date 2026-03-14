import { cn } from '@/lib/utils'
import { SidebarTrigger } from './ui/sidebar'

function AppHeader({ className, ...props }: React.ComponentProps<'header'>) {
  return (
    <header
      className={cn(
        'sticky md:static top-0 sm:flex z-50 bg-background flex items-start justify-between gap-4 px-4 md:px-10 py-4 md:py-8',
        className,
      )}
      {...props}
    />
  )
}

function AppHeaderContent({
  children,
  className,
  title,
  ...props
}: React.ComponentProps<'div'> & { title: string }) {
  return (
    <div className={cn('flex flex-col gap-1', className)} {...props}>
      <div className="flex items-center gap-3">
        <SidebarTrigger className="flex md:hidden" />
        <h1 className="font-medium text-foreground text-2xl leading-none">
          {title}
        </h1>
      </div>
      {children}
    </div>
  )
}

function AppHeaderDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-muted-foreground text-sm max-md:hidden', className)}
      {...props}
    />
  )
}

function AppHeaderActions({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-2', className)} {...props} />
}

export { AppHeader, AppHeaderActions, AppHeaderContent, AppHeaderDescription }

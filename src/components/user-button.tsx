import { UserIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { toastManager } from './ui/toast'
import { authClient } from '@/lib/auth-client'
import { adminAuthQueryKey } from '@/lib/admin-auth'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'

export default function UserButton() {
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  if (!session?.user) return null

  const username =
    (session.user as { username?: string | null }).username ?? ''
  const publicUrl = `${window.location.origin}/${username}`

  const copyProfileLink = () => {
    navigator.clipboard.writeText(publicUrl)
    toastManager.add({
      title: 'Copied',
      description: 'Profile link copied to clipboard',
    })
  }

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className="hover:bg-background/80 px-1.5 gap-2 flex items-center rounded-md border border-input bg-background shadow-sm"
      >
        {session.user.image ? (
          <Avatar className="size-5 rounded-md">
            <AvatarImage
              alt={session.user.name || 'User'}
              src={session.user.image}
            />
            <AvatarFallback>{session.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="size-5 rounded-md bg-muted flex items-center justify-center">
            <UserIcon className="size-3 text-muted-foreground" />
          </div>
        )}
        <span className="text-sm font-medium">
          {username || session.user.name.split(' ')[0]}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-56">
        <div className="flex items-center gap-2 p-2 px-3">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium leading-none">
              {session.user.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </div>
        <div className="my-1">
          <Link
            to="/admin"
            className="flex w-full items-center rounded-md px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
          >
            Dashboard
          </Link>
          <button
            onClick={copyProfileLink}
            className="flex w-full items-center rounded-md px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
          >
            Copy Page Link
          </button>
        </div>
        <div className="my-1 border-t" />
        <button
          onClick={async () => {
            await authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  queryClient.removeQueries({ queryKey: adminAuthQueryKey() })
                  router.invalidate()
                },
              },
            })
          }}
          className="flex w-full items-center rounded-md px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
        >
          Sign Out
        </button>
      </PopoverContent>
    </Popover>
  )
}

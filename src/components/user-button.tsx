import { LogOut, UserIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { authClient } from '@/lib/auth-client'
import { adminAuthQueryKey } from '@/lib/admin-auth'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover'
import { Button } from './ui/button'

export default function UserButton() {
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  if (!session?.user) return null

  const username =
    (session.user as { username?: string | null }).username ?? ''

  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className="px-1.5 gap-2 flex "
        render={<Button variant={'outline'} />}
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
      <PopoverContent align="end" sideOffset={10} className="w-46">
        <div className="flex flex-col gap-1">
          <Button className='justify-start gap-4 flex' variant={'ghost'} render={<Link to='/admin' />}>
            Dashboard
          </Button>
          <Button className='justify-start gap-4 flex' variant={'ghost'} render={<Link to='/admin/products' />}>
            Produk
          </Button>
          <Button className='justify-start gap-4 flex' variant={'ghost'} render={<Link to='/admin/editor/profiles' />}>
            Edit Profile
          </Button>

          <div className='my-1 border-t border-dashed' />
          <Button
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
            className='justify-start flex'
            variant={'ghost'}
          >
            <LogOut /> Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover >
  )
}

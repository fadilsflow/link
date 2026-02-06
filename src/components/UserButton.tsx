import { UserIcon } from 'lucide-react'
import { Link, useRouter } from '@tanstack/react-router'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { authClient } from '@/lib/auth-client'
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '@/components/ui/menu'

export default function UserButton() {
  const { data: session } = authClient.useSession()
  const router = useRouter()

  if (!session?.user) return null

  return (
    <Menu>
      <MenuTrigger render={<Button variant={'outline'} size={'default'} />}>
        {session.user.image ? (
          <Avatar className="size-5">
            <AvatarImage
              alt={session.user.name || 'User'}
              src={session.user.image}
            />
            <AvatarFallback>{session.user.name?.split(' ')[0]}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <span className="text-sm">
          {(session.user as any).username || session.user.name?.split(' ')[0]}
        </span>
      </MenuTrigger>
      <MenuPopup align="end" sideOffset={8}>
        <MenuItem
          render={
            <Link
              to={`/$username/admin/editor/profiles`}
              params={{ username: (session.user as any).username }}
            />
          }
        >
          {/* < className="mr-2 h-4 w-4" /> */}
          Edit Profile
        </MenuItem>
        <MenuItem
          render={
            <Link
              to={`/$username/admin/editor/appearance`}
              params={{ username: (session.user as any).username }}
            />
          }
        >
          {/* < className="mr-2 h-4 w-4" /> */}
          Edit Appearance
        </MenuItem>
        <MenuItem
          onClick={async () => {
            await authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.invalidate()
                  router.navigate({ to: '/' })
                },
              },
            })
          }}
        >
          {/* <LogOut className="mr-2 h-4 w-4" /> */}
          Log out
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

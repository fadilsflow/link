import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
import { LogOut, Settings, UserIcon } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from '@tanstack/react-router'
import { Button } from './ui/button'

export default function UserButton() {
  const { data: session } = authClient.useSession()
  const router = useRouter()

  if (!session?.user) return null

  return (
    <Menu>
      <MenuTrigger render={<Button variant={'outline'} size={'sm'} />}>
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="w-4 h-4 rounded-full object-cover border"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        <span className="text-xs">
          {(session.user as any).username || session.user.name?.split(' ')[0]}
        </span>
      </MenuTrigger>
      <MenuPopup align="end" sideOffset={8} className="w-56">
        <MenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Profile
        </MenuItem>
        <MenuSeparator />
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
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

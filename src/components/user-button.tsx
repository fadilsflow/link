import { UserIcon } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { toastManager } from './ui/toast'
import { authClient } from '@/lib/auth-client'
import { adminAuthQueryKey } from '@/lib/admin-auth'
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'

export default function UserButton() {
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  if (!session?.user) return null

  const username =
    (session.user as { username?: string | null }).username ?? ''
  const profileSearch = { tab: 'profile' as const }
  const publicUrl = `${window.location.origin}/${username}`

  const copyProfileLink = () => {
    navigator.clipboard.writeText(publicUrl)
    toastManager.add({
      title: 'Copied',
      description: 'Profile link copied to clipboard',
    })
  }

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            className="hover:bg-background/80 h-9 px-3 gap-2"
            variant={'outline'}
            size={'default'}
          />
        }
      >
        {session.user.image ? (
          <Avatar className="size-5">
            <AvatarImage
              alt={session.user.name || 'User'}
              src={session.user.image}
            />
            <AvatarFallback>{session.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="size-5 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="size-3 text-muted-foreground" />
          </div>
        )}
        <span className="text-sm font-medium">
          {username || session.user.name.split(' ')[0]}
        </span>
      </MenuTrigger>
      <MenuPopup align="end" sideOffset={8} className="w-56">
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
        <MenuGroup>
          <MenuItem
            render={
              <Link to="/admin" />
            }
          >
            Dashboard
          </MenuItem>
          <MenuItem
            render={
              <Link to="/admin/editor/profiles" />
            }
          >
            Edit Profile
          </MenuItem>
          <MenuItem
            render={
              <Link to="/admin/editor/appearance" />
            }
          >
            Appearance
          </MenuItem>
          <MenuItem
            className="cursor-pointer"
            render={
              <Link
                to={`/$username`}
                params={{ username }}
                search={profileSearch}
                target="_blank"
              />
            }
          >
            View My Page
          </MenuItem>
          <MenuItem onClick={copyProfileLink} className="cursor-pointer">
            Copy Page Link
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem
          onClick={async () => {
            await authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  queryClient.removeQueries({ queryKey: adminAuthQueryKey() })
                  router.invalidate()
                  router.navigate({ to: '/' })
                },
              },
            })
          }}
        >
          Sign Out
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

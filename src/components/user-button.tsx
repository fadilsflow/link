import {
  ExternalLink,
  LinkIcon,
  LogOut,
  Package,
  Palette,
  ShoppingBag,
  User,
  UserIcon,
} from 'lucide-react'
import { Link, useRouter } from '@tanstack/react-router'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { toastManager } from './ui/toast'
import { authClient } from '@/lib/auth-client'
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'

export default function UserButton() {
  const { data: session } = authClient.useSession()
  const router = useRouter()

  if (!session?.user) return null

  const username = (session.user as any).username
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
            <AvatarFallback>{session.user.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="size-5 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="size-3 text-muted-foreground" />
          </div>
        )}
        <span className="text-sm font-medium">
          {username || session.user.name?.split(' ')[0]}
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
        <MenuSeparator />
        <MenuGroup>
          <MenuItem
            className="cursor-pointer"
            render={
              <Link to={`/$username`} params={{ username }} target="_blank" />
            }
          >
            <ExternalLink className="mr-2 size-4" />
            View My Page
          </MenuItem>
          <MenuItem onClick={copyProfileLink} className="cursor-pointer">
            <LinkIcon className="mr-2 size-4" />
            Copy Page Link
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Management</MenuGroupLabel>
          <MenuItem
            render={
              <Link to={`/$username/admin/products`} params={{ username }} />
            }
          >
            <Package className="mr-2 size-4" />
            Products
          </MenuItem>
          <MenuItem
            render={
              <Link to={`/$username/admin/orders`} params={{ username }} />
            }
          >
            <ShoppingBag className="mr-2 size-4" />
            Orders
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Settings</MenuGroupLabel>
          <MenuItem
            render={
              <Link
                to={`/$username/admin/editor/profiles`}
                params={{ username }}
              />
            }
          >
            <User className="mr-2 size-4" />
            Edit Profile
          </MenuItem>
          <MenuItem
            render={
              <Link
                to={`/$username/admin/editor/appearance`}
                params={{ username }}
              />
            }
          >
            <Palette className="mr-2 size-4" />
            Appearance
          </MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem
          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
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
          <LogOut className="mr-2 size-4" />
          Sign Out
        </MenuItem>
      </MenuPopup>
    </Menu>
  )
}

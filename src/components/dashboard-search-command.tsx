import {
  ArrowDownIcon,
  ArrowUpIcon,
  ClipboardCopy,
  CornerDownLeftIcon,
  LogOut,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { toastManager } from '@/components/ui/toast'
import { authClient } from '@/lib/auth-client'
import { adminAuthQueryKey, useAdminAuthContext } from '@/lib/admin-auth'
import {
  adminCommandRouteItems,
  adminUtilityItems,
  type AdminRoutePath,
} from '@/lib/admin-navigation'
import { BASE_URL } from '@/lib/constans'

type CommandDefinition = {
  id: string
  label: string
  section: string
  shortcut?: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  keywords?: readonly string[]
  to?: AdminRoutePath
  onSelect?: () => Promise<void> | void
}

type CommandGroupItem = {
  value: string
  items: CommandDefinition[]
}

function buildSearchValue(command: CommandDefinition) {
  return [
    command.label,
    command.section,
    ...(command.keywords ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export default function DashboardSearchCommand({
  children,
}: {
  children?: React.ReactElement
}) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: adminAuth } = useAdminAuthContext()
  const username = adminAuth?.username ?? ''
  const publicPageUrl = username ? `${BASE_URL}/${username}` : ''

  const routeCommands = React.useMemo<Array<CommandDefinition>>(
    () =>
      adminCommandRouteItems.map((item) => ({
        id: `route:${item.url}`,
        label: item.title,
        section: 'Go To',
        icon: item.icon,
        keywords: item.keywords,
        to: item.url,
      })),
    [],
  )

  const actionCommands = React.useMemo<Array<CommandDefinition>>(
    () => [
      ...(username
        ? [
          {
            id: 'action:open-public-page',
            label: adminUtilityItems.openPublicPage.title,
            section: 'Quick Action',
            icon: adminUtilityItems.openPublicPage.icon,
            keywords: adminUtilityItems.openPublicPage.keywords,
            onSelect: () => {
              window.open(publicPageUrl, '_blank', 'noopener,noreferrer')
            },
          },
          {
            id: 'action:copy-public-page',
            label: adminUtilityItems.copyPageLink.title,
            section: 'Quick Action',
            icon: ClipboardCopy,
            keywords: adminUtilityItems.copyPageLink.keywords,
            onSelect: async () => {
              await navigator.clipboard.writeText(publicPageUrl)
              toastManager.add({
                title: 'Copied',
                description: 'Public page link copied to clipboard',
              })
            },
          },
        ]
        : []),
      {
        id: 'action:logout',
        label: 'Log out',
        section: 'Quick Action',
        icon: LogOut,
        keywords: ['sign out', 'logout', 'exit account'],
        onSelect: async () => {
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                queryClient.removeQueries({ queryKey: adminAuthQueryKey() })
                router.invalidate()
                router.navigate({ to: '/' })
              },
            },
          })
        },
      },
    ],
    [publicPageUrl, queryClient, router, username],
  )

  const groupedItems = React.useMemo<Array<CommandGroupItem>>(() => {
    const grouped = new Map<string, Array<CommandDefinition>>()

    for (const command of [...routeCommands, ...actionCommands]) {
      const current = grouped.get(command.section) ?? []
      current.push(command)
      grouped.set(command.section, current)
    }

    return Array.from(grouped.entries()).map(([value, items]) => ({
      value,
      items,
    }))
  }, [actionCommands, routeCommands])

  const handleItemClick = React.useCallback(
    async (item: CommandDefinition) => {
      setOpen(false)

      if (item.to) {
        await router.navigate({ to: item.to as any })
        return
      }

      await item.onSelect?.()
    },
    [router],
  )

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((current) => !current)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <CommandDialogTrigger render={children || <Button variant="outline" />}>
        {!children ? 'Open Command Palette' : null}
      </CommandDialogTrigger>
      <CommandDialogPopup>
        <Command items={groupedItems}>
          <CommandInput placeholder="Search pages, actions, products, orders..." />
          <CommandPanel>
            <CommandEmpty>No matching page or action found.</CommandEmpty>
            <CommandList>
              {(group: CommandGroupItem, index: number) => (
                <React.Fragment key={group.value}>
                  <CommandGroup items={group.items}>
                    <CommandGroupLabel className="uppercase">
                      {group.value}
                    </CommandGroupLabel>
                    <CommandCollection>
                      {(item: CommandDefinition) => (
                        <CommandItem
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          value={buildSearchValue(item)}
                        >
                          <item.icon className="mr-3 h-4 w-4 shrink-0 text-foreground/80" />
                          <span className="min-w-0 flex-1 truncate text-md text-foreground/80">
                            {item.label}
                          </span>
                          {item.shortcut ? (
                            <CommandShortcut>{item.shortcut}</CommandShortcut>
                          ) : null}
                        </CommandItem>
                      )}
                    </CommandCollection>
                  </CommandGroup>
                  {index < groupedItems.length - 1 ? <CommandSeparator /> : null}
                </React.Fragment>
              )}
            </CommandList>
          </CommandPanel>
          <CommandFooter>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <KbdGroup>
                  <Kbd>
                    <ArrowUpIcon />
                  </Kbd>
                  <Kbd>
                    <ArrowDownIcon />
                  </Kbd>
                </KbdGroup>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <Kbd>
                  <CornerDownLeftIcon />
                </Kbd>
                <span>Open</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Kbd>Esc</Kbd>
              <span>Close</span>
            </div>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  )
}

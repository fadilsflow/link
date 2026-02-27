import { Outlet, createFileRoute } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { PreviewProvider, usePreview } from '@/lib/preview-context'
import { AppearancePreview } from '@/components/dashboard/appearance/AppearancePreview'
import { ShareProfileModal } from '@/components/share-profile-modal'
import { BASE_URL } from '@/lib/constans'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Group, GroupSeparator } from '@/components/ui/group'
import { SimpleTooltip } from '@/components/ui/tooltip'

const PUBLIC_BASE_HOST = new URL(BASE_URL).host

export const Route = createFileRoute('/admin/editor')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PreviewProvider>
      <EditorLayout />
    </PreviewProvider>
  )
}

function EditorLayout() {
  const { user, blocks, socialLinks, status } = usePreview()

  return (
    <main className="grid grid-cols-1 lg:grid-cols-[2.2fr_1.4fr] min-h-screen lg:h-screen lg:overflow-hidden text-zinc-900">
      {/* Content Area - Outlet renders child routes */}
      <div className="lg:h-full lg:overflow-y-auto no-scrollbar scroll-smooth">
        <div className="">
          <Outlet />
        </div>
      </div>

      {/* PREVIEW Section - Shared across all editor routes */}
      <div className="block border-t lg:border-t-0 lg:border-l lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden bg-zinc-50/50 lg:bg-transparent">
        <div className="lg:h-full flex flex-col items-center py-10 lg:pt-10">
          <div className="flex items-center gap-2 mb-6 shrink-0">
            <Group>
              <ShareProfileModal url={`${BASE_URL}/${user?.username || ''}`}>
                <Button
                  className="rounded-full py-6 px-6 font-semibold"
                  variant={'outline'}
                  size={'lg'}
                >
                  <span className="truncate max-w-[120px] md:max-w-40">
                    {user?.username
                      ? `${PUBLIC_BASE_HOST}/${user.username}`
                      : `${PUBLIC_BASE_HOST}/loading`}
                  </span>
                </Button>
              </ShareProfileModal>
              <GroupSeparator />
              <SimpleTooltip content='Open Link' render={<Button variant='secondary' className='rounded-full py-6 px-6' render={<a href={`${BASE_URL}/${user?.username}`} target='_blank' rel="noopener noreferrer" />} />}>
                {status.isSaving ? (
                  <div className="flex items-center">
                    <Spinner className="w-4 h-4" />
                  </div>
                ) : <ExternalLink />}
              </SimpleTooltip>
            </Group>
          </div>
          <div className="pt-5 relative flex-1 w-full min-h-0 ">
            {user ? (
              <AppearancePreview user={user} blocks={blocks} socialLinks={socialLinks} />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-2">
                <div className="aspect-9/18 w-full max-w-[280px] overflow-hidden rounded-[32px] border-3 bg-muted relative">
                  <div className="flex items-center justify-center h-full animate-pulse text-zinc-400 text-xs">
                    <Spinner className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main >
  )
}

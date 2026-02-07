import { createFileRoute, Outlet } from '@tanstack/react-router'
import { PreviewProvider, usePreview } from '@/lib/preview-context'
import { AppearancePreview } from '@/components/dashboard/appearance/AppearancePreview'
import { ShareProfileModal } from '@/components/share-profile-modal'
import { BASE_URL } from '@/lib/constans'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/$username/admin/editor')({
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
  const { user, blocks, status } = usePreview()

  return (
    <main className="grid grid-cols-1 lg:grid-cols-[2.2fr_1.4fr] h-screen overflow-hidden text-zinc-900">
      {/* Content Area - Outlet renders child routes */}
      <div className="h-full overflow-y-auto no-scrollbar scroll-smooth">
        <div className="p-6">
          <Outlet />
        </div>
      </div>

      {/* PREVIEW Section - Shared across all editor routes */}
      <div className="hidden lg:block sticky top-0 h-screen border-l overflow-hidden">
        <div className="h-full flex flex-col items-center pt-10">
          <div className="flex items-center gap-2 mb-6 shrink-0">
            <ShareProfileModal url={`${BASE_URL}/${user?.username || ''}`} />
            {status.isSaving && (
              <span className="text-xs text-amber-500 font-medium animate-pulse">
                Saving...
              </span>
            )}
            {status.isSaved && !status.isSaving && (
              <span className="text-xs text-green-500 font-medium">Saved</span>
            )}
          </div>
          <div className="flex-1 w-full min-h-0 pb-10">
            {user ? (
              <AppearancePreview user={user} blocks={blocks} />
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
    </main>
  )
}

import { createFileRoute, Outlet } from '@tanstack/react-router'
import { PreviewProvider, usePreview } from '@/lib/preview-context'
import { AppearancePreview } from '@/components/dashboard/appearance/AppearancePreview'

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
    <main className="grid grid-cols-1 lg:grid-cols-[2.2fr_1.4fr]">
      {/* Content Area - Outlet renders child routes */}
      <div className="space-y-4 min-h-screen pr-6">
        <Outlet />
      </div>

      {/* PREVIEW Section - Shared across all editor routes */}
      <div className="hidden lg:block min-h-screen bg-muted/30 border-l border-zinc-200">
        <div className="sticky top-24 pt-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Live Preview
              </span>
              {status.isSaving && (
                <span className="text-xs text-amber-500 font-medium animate-pulse">
                  Saving...
                </span>
              )}
              {status.isSaved && !status.isSaving && (
                <span className="text-xs text-green-500 font-medium">
                  Saved
                </span>
              )}
            </div>
            {user ? (
              <AppearancePreview user={user} blocks={blocks} />
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                <div className="aspect-9/18 w-full max-w-[320px] overflow-hidden rounded-[32px] border-8 border-zinc-900 bg-gray-100 shadow-2xl relative flex items-center justify-center">
                  <div className="animate-pulse text-zinc-400 text-xs">
                    Loading preview...
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

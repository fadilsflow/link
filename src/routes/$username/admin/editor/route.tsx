import { Outlet, createFileRoute } from '@tanstack/react-router'
import { CircleCheck, Share } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PreviewProvider, usePreview } from '@/lib/preview-context'
import { AppearancePreview } from '@/components/dashboard/appearance/AppearancePreview'
import { ShareProfileModal } from '@/components/share-profile-modal'
import { BASE_URL } from '@/lib/constans'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'

const PUBLIC_BASE_HOST = new URL(BASE_URL).host

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
  const [showCheck, setShowCheck] = useState(false)

  useEffect(() => {
    if (status.isSaved && !status.isSaving) {
      setShowCheck(true)
      setTimeout(() => {
        setShowCheck(false)
      }, 5000)
    }
  }, [status.isSaved, status.isSaving])

  return (
    <main className="grid grid-cols-1 lg:grid-cols-[2.2fr_1.4fr] min-h-screen lg:h-screen lg:overflow-hidden text-zinc-900">
      {/* Content Area - Outlet renders child routes */}
      <div className="lg:h-full lg:overflow-y-auto no-scrollbar scroll-smooth">
        <div className="p-6">
          <Outlet />
        </div>
      </div>

      {/* PREVIEW Section - Shared across all editor routes */}
      <div className="block border-t lg:border-t-0 lg:border-l lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden bg-zinc-50/50 lg:bg-transparent">
        <div className="lg:h-full flex flex-col items-center py-10 lg:pt-10">
          <div className="flex items-center gap-2 mb-6 shrink-0">
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
                <Share className="ml-2 h-4 w-4" />
              </Button>
            </ShareProfileModal>
          </div>
          <div className="pt-5 relative flex-1 w-full min-h-0 pb-10">
            {user ? (
              <>
                <div className="absolute top-0 left-0 right-0 flex justify-center mb-6 shrink-0">
                  {status.isSaving && (
                    <div className="flex items-center">
                      <Spinner className="w-4 h-4" />
                    </div>
                  )}
                  {status.isSaved && !status.isSaving && (
                    <div className="flex items-center">
                      {showCheck && (
                        <CircleCheck className="w-4 h-4 text-foreground" />
                      )}
                    </div>
                  )}
                </div>
                <AppearancePreview user={user} blocks={blocks} />
              </>
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

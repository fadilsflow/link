import { Bookmark } from 'lucide-react'
import { useState } from 'react'
import UserButton from './user-button'
import { Button } from './ui/button'
import { SavedDrawer } from './saved-drawer'


export default function SiteUserProfileHeader() {
  const [isSavedOpen, setIsSavedOpen] = useState(false)

  return (
    <>
      <header className="z-50 px-2">
        <div className="mx-auto sm:max-w-2xl md:max-w-3xl">
          <div className="flex h-16 items-center justify-end px-3">
            <div className="ml-auto flex items-center gap-3">
              <UserButton />
              <Button
                variant="outline"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => setIsSavedOpen(true)}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <SavedDrawer open={isSavedOpen} onClose={() => setIsSavedOpen(false)} />
    </>
  )
}

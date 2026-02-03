import { StatusBadge, type SyncStatus } from './StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface ProfileEditorProps {
  user: {
    name: string
    title?: string | null
    bio?: string | null
  }
  status?: SyncStatus
  onUpdate: (field: string, value: string) => void
}

export function ProfileEditor({ user, onUpdate, status }: ProfileEditorProps) {
  return (
    <div className="relative flex items-center w-full">
      <Card className="flex-1 overflow-hidden border-zinc-100 shadow-sm transition-all duration-300 bg-white">
        <CardContent className="space-y-4 p-6 sm:p-8">
          <div className="space-y-4">
            <Input
              defaultValue={user.name}
              placeholder="Your Name"
              onChange={(e) => onUpdate('name', e.target.value)}
            />
            <Input
              defaultValue={user.title || ''}
              placeholder="Software Engineer"
              maxLength={30}
              onChange={(e) => onUpdate('title', e.target.value)}
            />
            <Textarea
              placeholder="Tell us about yourself..."
              defaultValue={user.bio || ''}
              onChange={(e) => onUpdate('bio', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* STATUS PANEL - ABSOLUTE POSITIONING */}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 pointer-events-none">
        <StatusBadge status={status} />
      </div>
    </div>
  )
}

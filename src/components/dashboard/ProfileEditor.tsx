import type { SyncStatus } from './StatusBadge'
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

export function ProfileEditor({ user, onUpdate }: ProfileEditorProps) {
  return (
    <Card>
      <CardContent className=" space-y-3">
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
      </CardContent>
    </Card>
  )
}

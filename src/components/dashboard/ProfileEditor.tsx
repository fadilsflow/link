import { Link } from '@tanstack/react-router'
import { Camera, Eye, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge, SyncStatus } from './StatusBadge'

interface ProfileEditorProps {
  user: {
    username: string
    name: string
    title?: string | null
    bio?: string | null
    image?: string | null
  }
  status?: SyncStatus
  onUpdate: (field: string, value: string) => void
}

export function ProfileEditor({
  user,
  status = 'saved',
  onUpdate,
}: ProfileEditorProps) {
  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardContent className="p-0 flex items-stretch">
        <div className="flex-1 p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="relative group cursor-pointer">
              <Avatar className="h-20 w-20 border-2 border-background shadow-sm">
                <AvatarImage src={user.image || '/avatar-placeholder.png'} />
                <AvatarFallback className="bg-black text-white text-xl">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to="/$username"
                params={{ username: user.username }}
                target="_blank"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 text-xs font-medium"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <div className="relative">
              <Input
                defaultValue={user.name}
                className="font-medium pr-10"
                onBlur={(e) => onUpdate('name', e.target.value)}
              />
              <Pencil className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            <div className="space-y-1">
              <div className="relative">
                <Input
                  defaultValue={user.title || ''}
                  placeholder="Job Title (e.g. Software Engineer)"
                  className="pr-16"
                  onBlur={(e) => onUpdate('title', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="relative">
                <Textarea
                  className="min-h-[100px] resize-none pr-16 text-sm"
                  placeholder="Bio"
                  defaultValue={user.bio || ''}
                  onBlur={(e) => onUpdate('bio', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Status Badge */}
        <StatusBadge
          status={status}
          className="w-24 border-l border-border/30 h-auto"
        />
      </CardContent>
    </Card>
  )
}

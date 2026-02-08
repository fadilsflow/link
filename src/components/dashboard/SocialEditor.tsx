import { useState, useEffect } from 'react'
import {
  GripVertical,
  Mail,
  PlusIcon,
  Trash2,
  Instagram,
  Github,
  Youtube,
  Facebook,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Gmail } from '../icon/gmail'
import { LinkedIn } from '../icon/linkedin'
import { XformerlyTwitter } from '../icon/x'
import { WhatsApp } from '../icon/whatsapp'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Field, FieldLabel } from '../ui/field'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { toastManager } from '../ui/toast'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { cn } from '@/lib/utils'

// Platform definitions with icons
const PLATFORMS = [
  {
    value: 'twitter',
    label: 'X (Twitter)',
    icon: XformerlyTwitter,
    iconClass: 'invert',
  },
  { value: 'linkedin', label: 'LinkedIn', icon: LinkedIn },
  { value: 'email', label: 'Email', icon: Gmail },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'whatsapp', label: 'WhatsApp', icon: WhatsApp },
] as const

type PlatformValue = (typeof PLATFORMS)[number]['value']

interface SocialLink {
  id: string
  userId: string
  platform: string
  url: string
  order: number
  isEnabled: boolean
}

interface SocialEditorProps {
  userId: string
  username: string
  socialLinks: SocialLink[]
}

function getPlatformIcon(platform: string) {
  const found = PLATFORMS.find((p) => p.value === platform)
  if (found) {
    const Icon = found.icon
    const iconClass =
      'iconClass' in found
        ? (found as { iconClass: string }).iconClass
        : undefined
    return <Icon className={cn('size-4', iconClass)} />
  }
  return <Mail className="size-4" />
}

interface SortableSocialItemProps {
  link: SocialLink
  onEdit: (link: SocialLink) => void
}

function SortableSocialItem({ link, onEdit }: SortableSocialItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative group', isDragging && 'z-50 opacity-50')}
    >
      <Button
        size="icon"
        variant="secondary"
        className={cn('relative', !link.isEnabled && 'opacity-50')}
        onClick={() => onEdit(link)}
      >
        {getPlatformIcon(link.platform)}
      </Button>
      <div
        {...attributes}
        {...listeners}
        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-background rounded-full p-0.5 shadow-sm border"
      >
        <GripVertical className="size-3 text-muted-foreground" />
      </div>
    </div>
  )
}

export default function SocialEditor({
  userId,
  username,
  socialLinks: initialSocialLinks,
}: SocialEditorProps) {
  const queryClient = useQueryClient()
  const [localSocialLinks, setLocalSocialLinks] =
    useState<SocialLink[]>(initialSocialLinks)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Form states
  const [newPlatform, setNewPlatform] = useState<PlatformValue>('twitter')
  const [newUrl, setNewUrl] = useState('')
  const [editPlatform, setEditPlatform] = useState<PlatformValue>('twitter')
  const [editUrl, setEditUrl] = useState('')
  const [editIsEnabled, setEditIsEnabled] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Sync local state with prop changes
  useEffect(() => {
    setLocalSocialLinks(initialSocialLinks)
  }, [initialSocialLinks])

  // Mutations
  const createMutation = useMutation({
    mutationKey: ['createSocialLink', username],
    mutationFn: (data: { userId: string; platform: string; url: string }) =>
      trpcClient.socialLink.create.mutate(data),
    onSuccess: (newLink) => {
      setLocalSocialLinks((prev) => [...prev, newLink])
      queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
    },
  })

  const updateMutation = useMutation({
    mutationKey: ['updateSocialLink', username],
    mutationFn: (data: {
      id: string
      platform?: string
      url?: string
      isEnabled?: boolean
    }) => trpcClient.socialLink.update.mutate(data),
    onSuccess: (updatedLink) => {
      setLocalSocialLinks((prev) =>
        prev.map((l) => (l.id === updatedLink.id ? updatedLink : l)),
      )
      queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
    },
  })

  const deleteMutation = useMutation({
    mutationKey: ['deleteSocialLink', username],
    mutationFn: (id: string) => trpcClient.socialLink.delete.mutate({ id }),
    onSuccess: (_, id) => {
      setLocalSocialLinks((prev) => prev.filter((l) => l.id !== id))
      queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
    },
  })

  const reorderMutation = useMutation({
    mutationKey: ['reorderSocialLinks', username],
    mutationFn: (items: Array<{ id: string; order: number }>) =>
      trpcClient.socialLink.reorder.mutate({ items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', username] })
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localSocialLinks.findIndex((l) => l.id === active.id)
    const newIndex = localSocialLinks.findIndex((l) => l.id === over.id)

    const newOrder = arrayMove(localSocialLinks, oldIndex, newIndex)
    const updates = newOrder.map((link, index) => ({
      id: link.id,
      order: index + 1,
    }))

    setLocalSocialLinks(
      newOrder.map((link, index) => ({ ...link, order: index + 1 })),
    )
    reorderMutation.mutate(updates)
  }

  const handleAdd = () => {
    const url =
      newPlatform === 'email' && !newUrl.startsWith('mailto:')
        ? `mailto:${newUrl}`
        : newUrl

    // Close dialog immediately
    setAddDialogOpen(false)
    const platformToAdd = newPlatform
    const urlToAdd = url
    setNewPlatform('twitter')
    setNewUrl('')

    toastManager.promise(
      createMutation.mutateAsync({
        userId,
        platform: platformToAdd,
        url: urlToAdd,
      }),
      {
        loading: { title: 'Adding social link...' },
        success: () => ({ title: 'Social link added!' }),
        error: (err: unknown) => ({
          title: 'Failed to add social link',
          description: (err as Error)?.message || 'An error occurred',
        }),
      },
    )
  }

  const handleEdit = (link: SocialLink) => {
    setEditingLink(link)
    setEditPlatform(link.platform as PlatformValue)
    setEditUrl(link.url)
    setEditIsEnabled(link.isEnabled)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingLink) return

    const url =
      editPlatform === 'email' && !editUrl.startsWith('mailto:')
        ? `mailto:${editUrl}`
        : editUrl

    // Close dialog immediately
    const linkId = editingLink.id
    const platformToSave = editPlatform
    const urlToSave = url
    const enabledToSave = editIsEnabled
    setEditDialogOpen(false)
    setEditingLink(null)

    toastManager.promise(
      updateMutation.mutateAsync({
        id: linkId,
        platform: platformToSave,
        url: urlToSave,
        isEnabled: enabledToSave,
      }),
      {
        loading: { title: 'Saving changes...' },
        success: () => ({ title: 'Changes saved!' }),
        error: (err: unknown) => ({
          title: 'Failed to save changes',
          description: (err as Error)?.message || 'An error occurred',
        }),
      },
    )
  }

  const handleDelete = () => {
    if (!editingLink) return

    // Close dialogs immediately
    const linkId = editingLink.id
    setEditDialogOpen(false)
    setDeleteDialogOpen(false)
    setEditingLink(null)

    toastManager.promise(deleteMutation.mutateAsync(linkId), {
      loading: { title: 'Deleting social link...' },
      success: () => ({ title: 'Social link deleted!' }),
      error: (err: unknown) => ({
        title: 'Failed to delete social link',
        description: (err as Error)?.message || 'An error occurred',
      }),
    })
  }

  return (
    <div className="flex gap-3 flex-wrap items-center">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localSocialLinks.map((l) => l.id)}
          strategy={horizontalListSortingStrategy}
        >
          {localSocialLinks.map((link) => (
            <SortableSocialItem key={link.id} link={link} onEdit={handleEdit} />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add Button */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger render={<Button size="icon" variant="secondary" />}>
          <PlusIcon size={16} />
        </DialogTrigger>
        <DialogPopup className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Social Link</DialogTitle>
            <DialogDescription>
              Add a new social media link to your profile.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="grid gap-4">
            <Field>
              <FieldLabel>Platform</FieldLabel>
              <Select
                value={newPlatform}
                onValueChange={(v) => setNewPlatform(v as PlatformValue)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <p.icon
                          className={cn(
                            'size-4',
                            'iconClass' in p
                              ? (p as { iconClass: string }).iconClass
                              : undefined,
                          )}
                        />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>
                {newPlatform === 'email' ? 'Email Address' : 'URL'}
              </FieldLabel>
              <Input
                placeholder={
                  newPlatform === 'email'
                    ? 'your@email.com'
                    : 'https://example.com/yourprofile'
                }
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </Field>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleAdd} disabled={!newUrl}>
              Add
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogPopup className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Social Link</DialogTitle>
            <DialogDescription>
              Update or delete this social media link.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="grid gap-4">
            <Field>
              <FieldLabel>Platform</FieldLabel>
              <Select
                value={editPlatform}
                onValueChange={(v) => setEditPlatform(v as PlatformValue)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <p.icon
                          className={cn(
                            'size-4',
                            'iconClass' in p
                              ? (p as { iconClass: string }).iconClass
                              : undefined,
                          )}
                        />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>
                {editPlatform === 'email' ? 'Email Address' : 'URL'}
              </FieldLabel>
              <Input
                placeholder={
                  editPlatform === 'email'
                    ? 'your@email.com'
                    : 'https://example.com/yourprofile'
                }
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
              />
            </Field>
            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch
                checked={editIsEnabled}
                onCheckedChange={setEditIsEnabled}
              />
            </div>
          </DialogPanel>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
            >
              <AlertDialogTrigger
                render={
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  />
                }
              >
                <Trash2 className="size-4 mr-2" />
                Delete
              </AlertDialogTrigger>
              <AlertDialogPopup>
                <div className="p-6 text-center sm:text-left">
                  <AlertDialogTitle>Delete Social Link</AlertDialogTitle>
                  <AlertDialogDescription className="mt-2">
                    Are you sure you want to delete this social link? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </div>
                <AlertDialogFooter>
                  <AlertDialogClose render={<Button variant="ghost" />}>
                    Cancel
                  </AlertDialogClose>
                  <Button
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogPopup>
            </AlertDialog>
            <div className="flex gap-2">
              <DialogClose render={<Button variant="ghost" />}>
                Cancel
              </DialogClose>
              <Button onClick={handleSaveEdit} disabled={!editUrl}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  )
}

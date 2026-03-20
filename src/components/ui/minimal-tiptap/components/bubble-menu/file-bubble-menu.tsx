import * as React from 'react'
import { BubbleMenu } from '@tiptap/react/menus'
import { NodeSelection } from '@tiptap/pm/state'
import { Pencil2Icon, TrashIcon } from '@radix-ui/react-icons'
import { FileEditBlock } from '../file/file-edit-block'
import { ToolbarButton } from '../toolbar-button'
import type { Editor } from '@tiptap/react'
import { Separator } from '@/components/ui/separator'

interface FileBubbleMenuProps {
  editor: Editor
}

export const FileBubbleMenu: React.FC<FileBubbleMenuProps> = ({ editor }) => {
  const [showEdit, setShowEdit] = React.useState(false)
  const [attrs, setAttrs] = React.useState<{
    name?: string
    description?: string
    url?: string
  }>({})

  const updateState = React.useCallback(() => {
    const { selection } = editor.state
    if (selection instanceof NodeSelection) {
      const node = selection.node
      if (node.type.name === 'file') {
        setAttrs(node.attrs)
      }
    }
  }, [editor])

  const shouldShow = React.useCallback(() => {
    if (!editor.isEditable) return false
    const { selection } = editor.state
    if (!(selection instanceof NodeSelection)) return false
    if (selection.node.type.name !== 'file') return false
    updateState()
    return true
  }, [editor, updateState])

  const handleSave = React.useCallback(
    (payload: { name: string; description: string }) => {
      editor.chain().focus().updateAttributes('file', payload).run()
      setShowEdit(false)
      updateState()
    },
    [editor, updateState],
  )

  const handleRemove = React.useCallback(() => {
    editor.chain().focus().deleteSelection().run()
    setShowEdit(false)
  }, [editor])

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="fileBubbleMenu"
      shouldShow={shouldShow}
      options={{
        placement: 'bottom-start',
        onHide: () => setShowEdit(false),
      }}
    >
      {showEdit ? (
        <FileEditBlock
          defaultName={attrs.name}
          defaultDescription={attrs.description}
          onSave={handleSave}
          className="bg-popover text-popover-foreground w-full min-w-80 rounded-md border p-4 shadow-md outline-hidden"
        />
      ) : (
        <div className="bg-background flex overflow-hidden rounded border p-1 shadow-lg">
          <div className="inline-flex items-center gap-1">
            <ToolbarButton tooltip="Edit" onClick={() => setShowEdit(true)}>
              <Pencil2Icon />
            </ToolbarButton>
            <Separator orientation="vertical" />
            <ToolbarButton tooltip="Remove" onClick={handleRemove}>
              <TrashIcon />
            </ToolbarButton>
          </div>
        </div>
      )}
    </BubbleMenu>
  )
}

export default FileBubbleMenu

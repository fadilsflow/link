import * as React from 'react'
import { BubbleMenu } from '@tiptap/react/menus'
import { NodeSelection } from '@tiptap/pm/state'
import { ExternalLinkIcon, Pencil2Icon, TrashIcon } from '@radix-ui/react-icons'
import { ButtonEditBlock } from '../button/button-edit-block'
import { ToolbarButton } from '../toolbar-button'
import type { Editor } from '@tiptap/react'
import { Separator } from '@/components/ui/separator'

interface ButtonBubbleMenuProps {
  editor: Editor
}

export const ButtonBubbleMenu: React.FC<ButtonBubbleMenuProps> = ({
  editor,
}) => {
  const [showEdit, setShowEdit] = React.useState(false)
  const [attrs, setAttrs] = React.useState<{
    text?: string
    url?: string
    variant?: string
    size?: string
    alignment?: string
  }>({})

  const updateState = React.useCallback(() => {
    const { selection } = editor.state
    if (selection instanceof NodeSelection) {
      const node = selection.node
      if (node.type.name === 'button') {
        setAttrs(node.attrs)
      }
    }
  }, [editor])

  const shouldShow = React.useCallback(() => {
    if (!editor.isEditable) return false
    const { selection } = editor.state
    if (!(selection instanceof NodeSelection)) return false
    if (selection.node.type.name !== 'button') return false
    updateState()
    return true
  }, [editor, updateState])

  const handleSave = React.useCallback(
    (payload: {
      text: string
      url: string
      variant: string
      size: string
      alignment: string
    }) => {
      editor.chain().focus().updateAttributes('button', payload).run()
      setShowEdit(false)
      updateState()
    },
    [editor, updateState],
  )

  const handleRemove = React.useCallback(() => {
    editor.chain().focus().deleteSelection().run()
    setShowEdit(false)
  }, [editor])

  const handleOpenLink = React.useCallback(() => {
    if (attrs.url) {
      window.open(attrs.url, '_blank', 'noopener,noreferrer')
    }
  }, [attrs.url])

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="buttonBubbleMenu"
      shouldShow={shouldShow}
      options={{
        placement: 'bottom-start',
        onHide: () => setShowEdit(false),
      }}
    >
      {showEdit ? (
        <ButtonEditBlock
          defaultText={attrs.text}
          defaultUrl={attrs.url}
          defaultVariant={attrs.variant}
          defaultSize={attrs.size}
          defaultAlignment={attrs.alignment}
          onSave={handleSave}
          className="bg-popover text-popover-foreground w-full min-w-80 rounded-md border p-4 shadow-md outline-none"
        />
      ) : (
        <div className="bg-background flex overflow-hidden rounded border p-1 shadow-lg">
          <div className="inline-flex items-center gap-1">
            <ToolbarButton
              tooltip="Edit Button"
              onClick={() => setShowEdit(true)}
            >
              <Pencil2Icon />
            </ToolbarButton>
            <Separator orientation="vertical" />
            <ToolbarButton tooltip="Open Link" onClick={handleOpenLink}>
              <ExternalLinkIcon />
            </ToolbarButton>
            <Separator orientation="vertical" />
            <ToolbarButton tooltip="Remove Button" onClick={handleRemove}>
              <TrashIcon />
            </ToolbarButton>
          </div>
        </div>
      )}
    </BubbleMenu>
  )
}

export default ButtonBubbleMenu

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ReplaceStep } from '@tiptap/pm/transform'
import { FileViewBlock } from './components/file-view-block'
import type { Editor } from '@tiptap/core'
import type { Attrs } from '@tiptap/pm/model'

export type FileUploadReturnType =
  | string
  | { id?: string | number; url: string }
  | { id?: string | number; src: string }

export interface FileOptions {
  HTMLAttributes: Record<string, unknown>
  uploadFn?: (
    file: globalThis.File,
    editor: Editor,
  ) => Promise<FileUploadReturnType>
  onFileRemoved?: (attrs: Attrs) => void
}

export const File = Node.create<FileOptions>({
  name: 'file',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      uploadFn: undefined,
      onFileRemoved: undefined,
    }
  },

  addAttributes() {
    return {
      url: { default: null },
      name: { default: '' },
      type: { default: '' },
      size: { default: null },
      description: { default: '' },
      id: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-file-card]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-file-card': 'true',
      }),
    ]
  },

  onTransaction({ transaction }) {
    transaction.steps.forEach((step) => {
      if (step instanceof ReplaceStep && step.slice.size === 0) {
        const deletedPages = transaction.before.content.cut(step.from, step.to)

        deletedPages.forEach((node) => {
          if (node.type.name === 'file') {
            const attrs = node.attrs

            if (attrs.url?.startsWith('blob:')) {
              URL.revokeObjectURL(attrs.url)
            }

            this.options.onFileRemoved?.(attrs)
          }
        })
      }
    })
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileViewBlock, {
      className: 'block-node',
    })
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { selection } = editor.state
        if (
          selection.$anchor.parent.type.name === this.name ||
          (selection.empty &&
            selection.$anchor.nodeBefore?.type.name === this.name)
        ) {
          return editor.commands.deleteSelection()
        }
        return false
      },
    }
  },
})

export default File

import * as React from 'react'
import { StarterKit } from '@tiptap/starter-kit'
import { useEditor } from '@tiptap/react'
import { Typography } from '@tiptap/extension-typography'
import { TextStyle } from '@tiptap/extension-text-style'
import { Placeholder, Selection } from '@tiptap/extensions'
import { toast } from 'sonner'
import { fileToBase64, getOutput, randomId } from '../utils'
import { useThrottle } from '../hooks/use-throttle'
import {
  ButtonExtension,
  CodeBlockLowlight,
  Color,
  File as FileExtension,
  FileHandler,
  HorizontalRule,
  Image,
  ResetMarksOnEnter,
  UnsetAllMarks,
} from '../extensions'
import type { Content, Editor, UseEditorOptions  } from '@tiptap/react'
import { cn } from '@/lib/utils'

export interface UseMinimalTiptapEditorProps extends UseEditorOptions {
  value?: Content
  output?: 'html' | 'json' | 'text'
  placeholder?: string
  editorClassName?: string
  throttleDelay?: number
  onUpdate?: (content: Content) => void
  onBlur?: (content: Content) => void
  uploader?: (file: File) => Promise<string>
  allowImageUpload?: boolean
  allowFileUpload?: boolean
}

async function fakeuploader(file: File): Promise<string> {
  // NOTE: This is a fake upload function. Replace this with your own upload logic.
  // This function should return the uploaded image URL.

  // wait 3s to simulate upload
  await new Promise((resolve) => setTimeout(resolve, 3000))

  const src = await fileToBase64(file)

  return src
}

const createExtensions = ({
  placeholder,
  uploader,
  allowImageUpload = true,
  allowFileUpload = true,
}: {
  placeholder: string
  uploader?: (file: File) => Promise<string>
  allowImageUpload?: boolean
  allowFileUpload?: boolean
}) => [
  StarterKit.configure({
    blockquote: { HTMLAttributes: { class: 'block-node' } },
    // bold
    bulletList: { HTMLAttributes: { class: 'list-node' } },
    code: { HTMLAttributes: { class: 'inline', spellcheck: 'false' } },
    codeBlock: false,
    // document
    dropcursor: { width: 2, class: 'ProseMirror-dropcursor border' },
    // gapcursor
    // hardBreak
    heading: { HTMLAttributes: { class: 'heading-node' } },
    // undoRedo
    horizontalRule: false,
    // italic
    // listItem
    // listKeymap
    link: {
      enableClickSelection: true,
      openOnClick: false,
      HTMLAttributes: {
        class: 'link',
      },
    },
    orderedList: { HTMLAttributes: { class: 'list-node' } },
    paragraph: { HTMLAttributes: { class: 'text-node' } },
    // strike
    // text
    // underline
    // trailingNode
  }),
  ...(allowImageUpload
    ? [
        Image.configure({
          allowedMimeTypes: ['image/*'],
          maxFileSize: 5 * 1024 * 1024,
          allowBase64: true,
          uploadFn: allowImageUpload
            ? async (file) =>
                uploader ? await uploader(file) : await fakeuploader(file)
            : undefined,
          onToggle: allowImageUpload
            ? (editor, files, pos) => {
                editor.commands.insertContentAt(
                  pos,
                  files.map((image) => {
                    const blobUrl = URL.createObjectURL(image)
                    const id = randomId()

                    return {
                      type: 'image',
                      attrs: {
                        id,
                        src: blobUrl,
                        alt: image.name,
                        title: image.name,
                        fileName: image.name,
                      },
                    }
                  }),
                )
              }
            : undefined,
          onImageRemoved({ id, src }) {
            console.log('Image removed', { id, src })
          },
          onValidationError(errors) {
            errors.forEach((error) => {
              toast.error('Image validation error', {
                position: 'bottom-right',
                description: error.reason,
              })
            })
          },
          onActionSuccess({ action }) {
            const mapping = {
              copyImage: 'Copy Image',
              copyLink: 'Copy Link',
              download: 'Download',
            }
            toast.success(mapping[action], {
              position: 'bottom-right',
              description: 'Image action success',
            })
          },
          onActionError(error, { action }) {
            const mapping = {
              copyImage: 'Copy Image',
              copyLink: 'Copy Link',
              download: 'Download',
            }
            toast.error(`Failed to ${mapping[action]}`, {
              position: 'bottom-right',
              description: error.message,
            })
          },
        }),
      ]
    : []),
  ...(allowImageUpload
    ? [
        FileHandler.configure({
          allowBase64: false,
          allowedMimeTypes: ['image/*'],
          maxFileSize: 5 * 1024 * 1024,
          onDrop: (editor, files, pos) => {
            files.forEach(async (file) => {
              const src = URL.createObjectURL(file)
              editor.commands.insertContentAt(pos, {
                type: 'image',
                attrs: {
                  src,
                  alt: file.name,
                  title: file.name,
                  fileName: file.name,
                },
              })
            })
          },
          onPaste: (editor, files) => {
            files.forEach(async (file) => {
              const src = URL.createObjectURL(file)
              editor.commands.insertContent({
                type: 'image',
                attrs: {
                  src,
                  alt: file.name,
                  title: file.name,
                  fileName: file.name,
                },
              })
            })
          },
          onValidationError: (errors) => {
            errors.forEach((error) => {
              toast.error('Image validation error', {
                position: 'bottom-right',
                description: error.reason,
              })
            })
          },
        }),
      ]
    : []),
  Color,
  TextStyle,
  Selection,
  Typography,
  UnsetAllMarks,
  HorizontalRule,
  ResetMarksOnEnter,
  CodeBlockLowlight,
  ...(allowFileUpload
    ? [
        FileExtension.configure({
          uploadFn: async (file) => {
            return uploader ? await uploader(file) : await fakeuploader(file)
          },
          onFileRemoved(attrs) {
            console.log('File removed', attrs)
          },
        }),
      ]
    : []),
  ButtonExtension,
  Placeholder.configure({ placeholder: () => placeholder }),
]

export const useMinimalTiptapEditor = ({
  value,
  output = 'html',
  placeholder = '',
  editorClassName,
  throttleDelay = 0,
  onUpdate,
  onBlur,
  uploader,
  allowImageUpload = true,
  allowFileUpload = true,
  ...props
}: UseMinimalTiptapEditorProps) => {
  const throttledSetValue = useThrottle(
    (value: Content) => onUpdate?.(value),
    throttleDelay,
  )

  const handleUpdate = React.useCallback(
    (editor: Editor) => throttledSetValue(getOutput(editor, output)),
    [output, throttledSetValue],
  )

  const handleCreate = React.useCallback(
    (editor: Editor) => {
      if (value && editor.isEmpty) {
        editor.commands.setContent(value)
      }
    },
    [value],
  )

  const handleBlur = React.useCallback(
    (editor: Editor) => onBlur?.(getOutput(editor, output)),
    [output, onBlur],
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions: createExtensions({
      placeholder,
      uploader,
      allowImageUpload,
      allowFileUpload,
    }),
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        class: cn('focus:outline-hidden', editorClassName),
      },
    },
    onUpdate: ({ editor }) => handleUpdate(editor),
    onCreate: ({ editor }) => handleCreate(editor),
    onBlur: ({ editor }) => handleBlur(editor),
    ...props,
  })

  return editor
}

export default useMinimalTiptapEditor

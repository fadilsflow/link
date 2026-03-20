import * as React from 'react'
import {  NodeViewWrapper } from '@tiptap/react'
import type {NodeViewProps} from '@tiptap/react';
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const ButtonViewBlock: React.FC<NodeViewProps> = ({
  editor,
  node,
  selected,
}) => {
  const { text, url, variant, size, alignment } = node.attrs

  const alignClass =
    {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    }[alignment as string] || 'justify-start'

  return (
    <NodeViewWrapper
      className={cn(
        'not-prose my-3 flex w-full',
        alignClass,
        editor.isEditable && 'cursor-move',
      )}
      data-drag-handle
    >
      <div
        className={cn('relative inline-block transition-all rounded-lg', {
          'outline-primary outline-2 outline-offset-1': selected,
        })}
      >
        {editor.isEditable ? (
          <Button
            type="button"
            variant={variant || 'default'}
            size={size || 'default'}
            className={cn('pointer-events-none')}
            tabIndex={-1}
          >
            {text || 'Click Me'}
          </Button>
        ) : (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Button
              type="button"
              variant={variant || 'default'}
              size={size || 'default'}
            >
              {text || 'Click Me'}
            </Button>
          </a>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export default ButtonViewBlock

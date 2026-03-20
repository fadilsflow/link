import type { Content } from '@tiptap/react'

type ContentNode = {
  text?: string
  marks?: Array<{ type?: string; attrs?: { href?: string } }>
  attrs?: { href?: string }
  content?: Array<ContentNode>
}

const isProbablyJson = (value: string) =>
  (value.startsWith('{') && value.endsWith('}')) ||
  (value.startsWith('[') && value.endsWith(']'))

export const normalizeTiptapContent = (value: unknown): Content | null => {
  if (value == null) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    if (isProbablyJson(trimmed)) {
      try {
        return JSON.parse(trimmed) as Content
      } catch {
        return value
      }
    }
    return value
  }

  if (typeof value === 'object') {
    return value as Content
  }

  return null
}

const collectText = (node: unknown, bucket: Array<string>) => {
  if (!node) return

  if (typeof node === 'string') {
    bucket.push(node)
    return
  }

  if (Array.isArray(node)) {
    node.forEach((child) => collectText(child, bucket))
    return
  }

  if (typeof node === 'object') {
    const typedNode = node as ContentNode
    if (typeof typedNode.text === 'string') {
      bucket.push(typedNode.text)
    }

    typedNode.marks?.forEach((mark) => {
      if (mark?.type === 'link' && typeof mark.attrs?.href === 'string') {
        bucket.push(mark.attrs.href)
      }
    })

    if (typeof typedNode.attrs?.href === 'string') {
      bucket.push(typedNode.attrs.href)
    }

    if (typedNode.content) {
      collectText(typedNode.content, bucket)
    }
  }
}

export const tiptapContentToText = (content: Content | null): string => {
  if (!content) return ''
  if (typeof content === 'string') return content

  const bucket: Array<string> = []
  collectText(content as unknown, bucket)

  return bucket.join(' ').replace(/\s+/g, ' ').trim()
}

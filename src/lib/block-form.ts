import { z } from 'zod'

export const blockTypeEnum = z.enum([
  'link',
  'text',
  'image',
  'video',
  'product',
  'discord',
  'telegram',
])

export type BlockType = z.infer<typeof blockTypeEnum>

export const telegramUsernameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_]{5,32}$/, 'Invalid Telegram username')

export const blockCreateInputSchema = z
  .object({
    title: z.string().default(''),
    url: z.string().default(''),
    type: blockTypeEnum.default('link'),
    content: z.string().optional(),
    isEnabled: z.boolean().optional(),
  })
  .superRefine((input, ctx) => {
    const checks: Record<
      BlockType,
      () => Array<{ path: 'title' | 'url' | 'content'; message: string }>
    > = {
      link: () => {
        const errors: Array<{ path: 'title' | 'url' | 'content'; message: string }> = []
        if (!input.title.trim()) errors.push({ path: 'title', message: 'Title is required' })
        if (input.url && !z.string().url().safeParse(input.url).success) {
          errors.push({ path: 'url', message: 'Invalid URL' })
        }
        return errors
      },
      text: () => {
        if (!input.title.trim()) {
          return [{ path: 'title', message: 'Heading is required' }]
        }
        return []
      },
      image: () => {
        const errors: Array<{ path: 'title' | 'url' | 'content'; message: string }> = []
        if (!input.content || !z.string().url().safeParse(input.content).success) {
          errors.push({ path: 'content', message: 'Invalid image URL' })
        }
        if (input.url && !z.string().url().safeParse(input.url).success) {
          errors.push({ path: 'url', message: 'Invalid URL' })
        }
        return errors
      },
      video: () => {
        const errors: Array<{ path: 'title' | 'url' | 'content'; message: string }> = []
        if (!input.title.trim()) errors.push({ path: 'title', message: 'Title is required' })
        if (!input.content || !z.string().url().safeParse(input.content).success) {
          errors.push({ path: 'content', message: 'Invalid video URL' })
        }
        return errors
      },
      product: () => {
        if (!input.content?.trim()) {
          return [{ path: 'content', message: 'Please select a product' }]
        }
        return []
      },
      discord: () => {
        const errors: Array<{ path: 'title' | 'url' | 'content'; message: string }> = []
        if (!input.title.trim()) errors.push({ path: 'title', message: 'Title is required' })
        if (!input.url || !z.string().url().safeParse(input.url).success) {
          errors.push({ path: 'url', message: 'Invalid URL' })
        }
        return errors
      },
      telegram: () => {
        const errors: Array<{ path: 'title' | 'url' | 'content'; message: string }> = []
        if (!input.title.trim()) errors.push({ path: 'title', message: 'Title is required' })
        if (!input.content || !telegramUsernameSchema.safeParse(input.content).success) {
          errors.push({ path: 'content', message: 'Invalid Telegram username' })
        }
        return errors
      },
    }

    for (const error of checks[input.type]()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [error.path],
        message: error.message,
      })
    }
  })

export const blockUpdateInputSchema = blockCreateInputSchema.extend({
  id: z.string(),
})

export type BlockFormValues = z.infer<typeof blockCreateInputSchema>
export type BlockFieldErrors = Partial<
  Record<'title' | 'url' | 'content', string>
>

export function getDefaultBlockValues(type: BlockType): BlockFormValues {
  return {
    type,
    title: type === 'discord' ? 'Discord' : type === 'telegram' ? 'Telegram' : '',
    url: '',
    content: '',
    isEnabled: true,
  }
}

export function getBlockFieldErrors(values: BlockFormValues): BlockFieldErrors {
  const parsed = blockCreateInputSchema.safeParse(values)
  if (parsed.success) return {}

  const errors: BlockFieldErrors = {}
  for (const issue of parsed.error.issues) {
    const path = issue.path[0]
    if (path === 'title' || path === 'url' || path === 'content') {
      if (!errors[path]) {
        errors[path] = issue.message
      }
    }
  }
  return errors
}


import { z } from 'zod'

export const blockTypeEnum = z.enum([
  'link',
  'text',
  'image',
  'video',
  'product',
  'discord',
  'telegram',
  'threads',
  'instagram',
  'tiktok',
  'twitter',
])

export type BlockType = z.infer<typeof blockTypeEnum>

export const telegramUsernameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_]{5,32}$/, 'Invalid Telegram username')

export const socialHandleSchema = z
  .string()
  .regex(/^[a-zA-Z0-9._]{1,30}$/, 'Invalid username')

export const twitterHandleSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_]{1,15}$/, 'Invalid X username')

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
        const errors: Array<{
          path: 'title' | 'url' | 'content'
          message: string
        }> = []
        if (!input.title.trim())
          errors.push({ path: 'title', message: 'Title is required' })
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
        const errors: Array<{
          path: 'title' | 'url' | 'content'
          message: string
        }> = []
        if (
          !input.content ||
          !z.string().url().safeParse(input.content).success
        ) {
          errors.push({ path: 'content', message: 'Invalid image URL' })
        }
        if (input.url && !z.string().url().safeParse(input.url).success) {
          errors.push({ path: 'url', message: 'Invalid URL' })
        }
        return errors
      },
      video: () => {
        const errors: Array<{
          path: 'title' | 'url' | 'content'
          message: string
        }> = []
        if (!input.title.trim())
          errors.push({ path: 'title', message: 'Title is required' })
        if (
          !input.content ||
          !z.string().url().safeParse(input.content).success
        ) {
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
        const errors: Array<{
          path: 'title' | 'url' | 'content'
          message: string
        }> = []
        if (!input.title.trim())
          errors.push({ path: 'title', message: 'Title is required' })
        if (!input.url || !z.string().url().safeParse(input.url).success) {
          errors.push({ path: 'url', message: 'Invalid URL' })
        }
        return errors
      },
      telegram: () => {
        const errors: Array<{
          path: 'title' | 'url' | 'content'
          message: string
        }> = []
        if (!input.title.trim())
          errors.push({ path: 'title', message: 'Title is required' })
        if (
          !input.content ||
          !telegramUsernameSchema.safeParse(input.content).success
        ) {
          errors.push({ path: 'content', message: 'Invalid Telegram username' })
        }
        return errors
      },
      threads: () => {
        const errors: Array<{
          path: 'title' | 'url' | 'content'
          message: string
        }> = []
        if (!input.title.trim())
          errors.push({ path: 'title', message: 'Title is required' })
        if (
          !input.content ||
          !socialHandleSchema.safeParse(input.content).success
        ) {
          errors.push({ path: 'content', message: 'Invalid Threads username' })
        }
        return errors
      },
      instagram: () => {
        const errors: Array<{
          path: 'title' | 'url' | 'content'
          message: string
        }> = []
        if (!input.title.trim())
          errors.push({ path: 'title', message: 'Title is required' })
        if (
          !input.content ||
          !socialHandleSchema.safeParse(input.content).success
        ) {
          errors.push({
            path: 'content',
            message: 'Invalid Instagram username',
          })
        }
        return errors
      },
      tiktok: () => {
        const errors: Array<{
          path: 'title' | 'url' | 'content'
          message: string
        }> = []
        if (!input.title.trim())
          errors.push({ path: 'title', message: 'Title is required' })
        if (
          !input.content ||
          !socialHandleSchema.safeParse(input.content).success
        ) {
          errors.push({ path: 'content', message: 'Invalid TikTok username' })
        }
        return errors
      },
      twitter: () => {
        const errors: Array<{
          path: 'title' | 'url' | 'content'
          message: string
        }> = []
        if (!input.title.trim())
          errors.push({ path: 'title', message: 'Title is required' })
        if (
          !input.content ||
          !twitterHandleSchema.safeParse(input.content).success
        ) {
          errors.push({ path: 'content', message: 'Invalid X username' })
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
    title:
      type === 'discord'
        ? 'Discord'
        : type === 'telegram'
          ? 'Telegram'
          : type === 'threads'
            ? 'Threads'
            : type === 'instagram'
              ? 'Instagram'
              : type === 'tiktok'
                ? 'TikTok'
                : type === 'twitter'
                  ? 'X / Twitter'
                  : '',
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

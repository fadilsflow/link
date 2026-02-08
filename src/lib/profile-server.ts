import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { user } from '@/db/schema'

export const getPublicProfile = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: username }) => {
    const dbUser = await db.query.user.findFirst({
      where: eq(user.username, username),
      with: {
        blocks: {
          where: (blocks, { eq }) => eq(blocks.isEnabled, true),
          orderBy: (blocks, { asc }) => [asc(blocks.order)],
        },
        products: true,
        socialLinks: {
          where: (socialLinks, { eq }) => eq(socialLinks.isEnabled, true),
          orderBy: (socialLinks, { asc }) => [asc(socialLinks.order)],
        },
      },
    })

    if (!dbUser) {
      return null
    }

    return {
      user: dbUser,
      blocks: dbUser.blocks,
      products: dbUser.products.filter((p) => p.isActive),
      socialLinks: dbUser.socialLinks,
    }
  })

export const getDashboardData = createServerFn({ method: 'GET' }).handler(
  async () => {
    // We can get the session from the context/auth-server, but since this is called
    // from the admin route which already gatekeeps, we can just expect the caller
    // to arguably be secure, BUT relies on server-side session check is better.
    // However, for optimization in this specific flow, we might just pass the user ID
    // or rely on `getServerSession` again.
    // Given the previous optimization in onboarding-server, let's just use getServerSession here too.
    const { getServerSession } = await import('@/lib/auth-server')
    const session = await getServerSession()

    if (!session?.user?.id) {
      throw new Error('Unauthorized')
    }

    const dbUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      with: {
        blocks: {
          orderBy: (blocks, { asc }) => [asc(blocks.order)],
        },
        products: {
          orderBy: (products, { desc }) => [desc(products.createdAt)],
        },
        socialLinks: {
          orderBy: (socialLinks, { asc }) => [asc(socialLinks.order)],
        },
      },
    })

    if (!dbUser) {
      throw new Error('User not found')
    }

    return {
      user: dbUser,
      blocks: dbUser.blocks,
      products: dbUser.products,
      socialLinks: dbUser.socialLinks,
    }
  },
)

export const getPublicProduct = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      username: z.string(),
      productId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const dbUser = await db.query.user.findFirst({
      where: eq(user.username, data.username),
      with: {
        products: {
          where: (product, { and, eq }) =>
            and(eq(product.id, data.productId), eq(product.isActive, true)),
        },
      },
    })

    if (!dbUser || dbUser.products.length === 0) {
      return null
    }

    return {
      user: dbUser,
      product: dbUser.products[0],
    }
  })

export const getOrderByToken = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    // Lazy load orders to avoid circular deps if any, or just import at top?
    // Importing at top is fine since this is server-only file
    const { orders } = await import('@/db/schema')

    // Find order by token
    const order = await db.query.orders.findFirst({
      where: eq(orders.deliveryToken, data.token),
      with: {
        product: true,
        creator: true,
      },
    })

    if (!order) {
      return null
    }

    // Generate download URLs for product files
    const { StorageService } = await import('@/lib/storage')
    const productFiles = (order.product.productFiles as any[]) || []

    const filesWithDownloadUrls = await Promise.all(
      productFiles.map(async (file) => {
        const key = StorageService.getKeyFromUrl(file.url)
        if (key) {
          try {
            const downloadUrl = await StorageService.getDownloadUrl(
              key,
              file.name,
            )
            return {
              ...file,
              url: downloadUrl,
            }
          } catch (e) {
            console.error('Failed to sign url', e)
            return file
          }
        }
        return file
      }),
    )

    return {
      order,
      product: {
        ...order.product,
        productFiles: filesWithDownloadUrls,
      },
      creator: order.creator,
    }
  })

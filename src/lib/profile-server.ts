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
        products: {
          where: (products, { and, eq }) =>
            and(eq(products.isActive, true), eq(products.isDeleted, false)),
        },
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
      products: dbUser.products,
      socialLinks: dbUser.socialLinks,
    }
  })

export const getDashboardData = createServerFn({ method: 'GET' }).handler(
  async () => {
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
          // Show all non-deleted products in dashboard (including inactive)
          where: (products, { eq }) => eq(products.isDeleted, false),
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
            and(
              eq(product.id, data.productId),
              eq(product.isActive, true),
              eq(product.isDeleted, false),
            ),
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
    const { orders } = await import('@/db/schema')

    const order = await db.query.orders.findFirst({
      where: eq(orders.deliveryToken, data.token),
      with: {
        product: true,
        creator: true,
        items: {
          with: {
            product: true,
            creator: true,
          },
        },
      },
    })

    if (!order) return null

    const itemSnapshots =
      order.items.length > 0
        ? order.items
        : [
            {
              id: 'legacy',
              orderId: order.id,
              creatorId: order.creatorId,
              productId: order.productId,
              productTitle: order.productTitle,
              productImage: order.productImage,
              quantity: order.quantity,
              amountPaid: order.amountPaid,
              checkoutAnswers: order.checkoutAnswers ?? {},
              product: order.product,
              creator: order.creator,
            },
          ]

    const { StorageService } = await import('@/lib/storage')

    const deliveryItems = await Promise.all(
      itemSnapshots.map(async (item: any) => {
        const productData = item.product ?? {
          title: item.productTitle,
          images: item.productImage ? [item.productImage] : [],
          productUrl: null,
          productFiles: [],
        }

        const creatorData = item.creator ?? {
          name: 'Creator',
          email: '',
          image: null,
          username: null,
        }

        const productFiles = (productData.productFiles as Array<any>) || []
        const filesWithDownloadUrls = await Promise.all(
          productFiles.map(async (file) => {
            const key = StorageService.getKeyFromUrl(file.url)
            if (!key) return file
            try {
              const downloadUrl = await StorageService.getDownloadUrl(
                key,
                file.name,
              )
              return { ...file, url: downloadUrl }
            } catch (e) {
              console.error('Failed to sign url', e)
              return file
            }
          }),
        )

        return {
          id: item.id,
          productId: item.productId,
          title: item.productTitle ?? productData.title,
          image: item.productImage || productData.images?.[0] || null,
          quantity: item.quantity ?? 1,
          amountPaid: item.amountPaid ?? 0,
          checkoutAnswers: item.checkoutAnswers ?? {},
          productUrl: productData.productUrl,
          productFiles: filesWithDownloadUrls,
          creator: creatorData,
        }
      }),
    )

    const primaryCreator = deliveryItems[0]?.creator ?? {
      name: 'Creator',
      email: '',
      image: null,
      username: null,
    }

    return {
      order,
      items: deliveryItems,
      creator: primaryCreator,
    }
  })

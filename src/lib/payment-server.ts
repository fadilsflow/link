import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getPaymentSessionByCheckoutGroup } from '@/lib/payment-service'

export const getPaymentByCheckoutGroup = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      checkoutGroupId: z.string().trim().min(1),
    }),
  )
  .handler(async ({ data }) => {
    return getPaymentSessionByCheckoutGroup(data.checkoutGroupId)
  })

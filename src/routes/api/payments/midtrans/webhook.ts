import { createFileRoute } from '@tanstack/react-router'
import type {MidtransNotificationPayload} from '@/lib/midtrans';
import {
  
  verifyMidtransNotificationSignature
} from '@/lib/midtrans'
import { processMidtransNotification } from '@/lib/payment-service'

export const Route = createFileRoute('/api/payments/midtrans/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: MidtransNotificationPayload

        try {
          payload = (await request.json()) as MidtransNotificationPayload
        } catch {
          return Response.json(
            { ok: false, error: 'Invalid JSON payload' },
            { status: 400 },
          )
        }

        if (!payload?.signature_key || !payload?.order_id) {
          return Response.json(
            {
              ok: false,
              error: 'Missing required Midtrans notification fields',
            },
            { status: 400 },
          )
        }

        if (!verifyMidtransNotificationSignature(payload)) {
          return Response.json(
            { ok: false, error: 'Invalid Midtrans signature' },
            { status: 401 },
          )
        }

        const result = await processMidtransNotification(payload)

        return Response.json({
          ok: true,
          duplicate: result.duplicate,
          found: 'found' in result ? result.found : true,
          status: 'status' in result ? result.status : null,
        })
      },
    },
  },
})

import { createFileRoute } from '@tanstack/react-router'
import { verifyIrisWebhookSignature } from '@/lib/midtrans-iris'
import { processIrisNotification } from '@/server/services/payout'

export const Route = createFileRoute('/api/payments/midtrans/iris-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: any

        try {
          payload = await request.json()
        } catch {
          return Response.json(
            { ok: false, error: 'Invalid JSON payload' },
            { status: 400 },
          )
        }

        if (!payload?.reference_no || !payload?.status) {
          return Response.json(
            {
              ok: false,
              error: 'Missing required Midtrans Iris payload fields',
            },
            { status: 400 },
          )
        }

        if (!verifyIrisWebhookSignature(payload)) {
          return Response.json(
            { ok: false, error: 'Invalid Midtrans Iris signature' },
            { status: 401 },
          )
        }

        const result = await processIrisNotification(payload)

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

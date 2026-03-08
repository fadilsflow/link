import { createHash } from 'node:crypto'
import {
  CHECKOUT_PAYMENT_METHOD,
  type CheckoutPaymentMethod,
} from '@/lib/payment-methods'

export const MIDTRANS_PROVIDER = 'midtrans'
export type MidtransRequestedPaymentMethod = CheckoutPaymentMethod

export type MidtransChargeRequest = {
  payment_type: string
  transaction_details: {
    order_id: string
    gross_amount: number
  }
  customer_details: {
    first_name?: string
    email: string
  }
  item_details: Array<{
    id: string
    price: number
    quantity: number
    name: string
  }>
  bank_transfer?: {
    bank: 'bni' | 'bri' | 'bca' | 'cimb' | 'permata'
  }
  echannel?: {
    bill_info1: string
    bill_info2: string
  }
  gopay?: {
    enable_callback?: boolean
    callback_url?: string
  }
  credit_card?: {
    secure: boolean
  }
}

export type MidtransChargeResponse = {
  status_code?: string
  status_message?: string
  transaction_id?: string
  order_id?: string
  gross_amount?: string
  payment_type?: string
  transaction_status?: string
  fraud_status?: string
  transaction_time?: string
  expiry_time?: string
  permata_va_number?: string
  bill_key?: string
  biller_code?: string
  qr_string?: string
  actions?: Array<{
    name?: string
    method?: string
    url?: string
  }>
  va_numbers?: Array<{
    bank?: string
    va_number?: string
  }>
}

export type MidtransNotificationPayload = MidtransChargeResponse & {
  signature_key: string
}

export type NormalizedMidtransPaymentInstructions = {
  paymentType: string | null
  transactionStatus: string | null
  expiresAt: string | null
  qrString: string | null
  qrCodeUrl: string | null
  deeplinkUrl: string | null
  permataVaNumber: string | null
  vaNumbers: Array<{
    bank: string
    vaNumber: string
  }>
  billKey: string | null
  billerCode: string | null
}

type MidtransConfig = {
  isProduction: boolean
  serverKey: string
}

function getMidtransConfig(): MidtransConfig {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim()
  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is not configured')
  }

  return {
    isProduction:
      process.env.MIDTRANS_IS_PRODUCTION === 'true' ||
      process.env.MIDTRANS_ENV === 'production',
    serverKey,
  }
}

function getMidtransBaseUrl(isProduction: boolean): string {
  return isProduction
    ? 'https://api.midtrans.com'
    : 'https://api.sandbox.midtrans.com'
}

function getMidtransAuthHeader(serverKey: string): string {
  return `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`
}

export function createMidtransOrderId(checkoutGroupId: string): string {
  return `kreasi-${checkoutGroupId}`.slice(0, 50)
}

function sanitizeMidtransText(value: string, maxLength: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export function buildMidtransChargeRequest(params: {
  providerOrderId: string
  requestedMethod: MidtransRequestedPaymentMethod
  grossAmount: number
  buyerEmail: string
  buyerName?: string | null
  itemDetails: MidtransChargeRequest['item_details']
  serviceFeeAmount?: number
  gatewayFeeAmount?: number
}): MidtransChargeRequest {
  const itemDetails = params.itemDetails.map((item) => ({
    id: sanitizeMidtransText(item.id, 50),
    price: item.price,
    quantity: item.quantity,
    name: sanitizeMidtransText(item.name, 50),
  }))

  if (params.serviceFeeAmount && params.serviceFeeAmount > 0) {
    itemDetails.push({
      id: 'platform-service-fee',
      price: params.serviceFeeAmount,
      quantity: 1,
      name: 'Platform service fee',
    })
  }

  if (params.gatewayFeeAmount && params.gatewayFeeAmount > 0) {
    itemDetails.push({
      id: 'payment-gateway-fee',
      price: params.gatewayFeeAmount,
      quantity: 1,
      name: 'Payment gateway fee',
    })
  }

  const itemDetailsTotal = itemDetails.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )
  const grossAmountDelta = params.grossAmount - itemDetailsTotal

  if (grossAmountDelta !== 0 && itemDetails.length > 0) {
    const lastItem = itemDetails[itemDetails.length - 1]
    const nextPrice = lastItem.price + grossAmountDelta
    if (nextPrice <= 0) {
      throw new Error('Invalid Midtrans payload: item details exceed gross amount')
    }
    itemDetails[itemDetails.length - 1] = {
      ...lastItem,
      price: nextPrice,
    }
  }

  const baseRequest: MidtransChargeRequest = {
    payment_type: 'gopay',
    transaction_details: {
      order_id: params.providerOrderId,
      gross_amount: params.grossAmount,
    },
    customer_details: {
      first_name: params.buyerName
        ? sanitizeMidtransText(params.buyerName, 50)
        : undefined,
      email: params.buyerEmail,
    },
    item_details: itemDetails,
  }

  switch (params.requestedMethod) {
    case CHECKOUT_PAYMENT_METHOD.QRIS:
      return {
        ...baseRequest,
        payment_type: 'qris',
      }
    case CHECKOUT_PAYMENT_METHOD.GOPAY:
      return {
        ...baseRequest,
        payment_type: 'gopay',
        gopay: {
          enable_callback: true,
        },
      }
    case CHECKOUT_PAYMENT_METHOD.GOPAY_DYNAMIC_QRIS:
      return {
        ...baseRequest,
        payment_type: 'gopay',
      }
    case CHECKOUT_PAYMENT_METHOD.SEABANK:
      return {
        ...baseRequest,
        payment_type: 'bank_transfer',
        bank_transfer: {
          bank: 'permata',
        },
      }
    case CHECKOUT_PAYMENT_METHOD.CIMB:
      return {
        ...baseRequest,
        payment_type: 'bank_transfer',
        bank_transfer: {
          bank: 'cimb',
        },
      }
    case CHECKOUT_PAYMENT_METHOD.BNI:
      return {
        ...baseRequest,
        payment_type: 'bank_transfer',
        bank_transfer: {
          bank: 'bni',
        },
      }
    case CHECKOUT_PAYMENT_METHOD.BRI:
      return {
        ...baseRequest,
        payment_type: 'bank_transfer',
        bank_transfer: {
          bank: 'bri',
        },
      }
    case CHECKOUT_PAYMENT_METHOD.MANDIRI:
      return {
        ...baseRequest,
        payment_type: 'echannel',
        echannel: {
          bill_info1: 'Payment:',
          bill_info2: 'Digital purchase',
        },
      }
    case CHECKOUT_PAYMENT_METHOD.PERMATA:
      return {
        ...baseRequest,
        payment_type: 'bank_transfer',
        bank_transfer: {
          bank: 'permata',
        },
      }
    case CHECKOUT_PAYMENT_METHOD.CARD:
      return {
        ...baseRequest,
        payment_type: 'credit_card',
        credit_card: {
          secure: true,
        },
      }
  }
}

export async function createMidtransCharge(
  payload: MidtransChargeRequest,
): Promise<MidtransChargeResponse> {
  const config = getMidtransConfig()
  const response = await fetch(`${getMidtransBaseUrl(config.isProduction)}/v2/charge`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: getMidtransAuthHeader(config.serverKey),
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  const parsed = text ? (JSON.parse(text) as MidtransChargeResponse) : {}
  if (!response.ok) {
    throw new Error(
      parsed.status_message
        ? `Midtrans charge failed (${response.status}): ${parsed.status_message}`
        : `Midtrans charge failed (${response.status}): ${text || 'Unknown error'}`,
    )
  }

  return parsed
}

export async function getMidtransPaymentStatus(
  providerOrderId: string,
): Promise<MidtransChargeResponse> {
  const config = getMidtransConfig()
  const response = await fetch(
    `${getMidtransBaseUrl(config.isProduction)}/v2/${encodeURIComponent(providerOrderId)}/status`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: getMidtransAuthHeader(config.serverKey),
      },
    },
  )

  const text = await response.text()
  const parsed = text ? (JSON.parse(text) as MidtransChargeResponse) : {}
  if (!response.ok) {
    throw new Error(
      parsed.status_message
        ? `Midtrans status failed (${response.status}): ${parsed.status_message}`
        : `Midtrans status failed (${response.status}): ${text || 'Unknown error'}`,
    )
  }

  return parsed
}

export function verifyMidtransNotificationSignature(
  payload: MidtransNotificationPayload,
): boolean {
  const config = getMidtransConfig()
  const expectedSignature = createHash('sha512')
    .update(
      `${payload.order_id ?? ''}${payload.status_code ?? ''}${payload.gross_amount ?? ''}${config.serverKey}`,
    )
    .digest('hex')

  return expectedSignature === payload.signature_key
}

export function derivePaymentStatus(params: {
  transactionStatus?: string | null
  fraudStatus?: string | null
}): string {
  const transactionStatus = `${params.transactionStatus ?? ''}`.toLowerCase()
  const fraudStatus = `${params.fraudStatus ?? ''}`.toLowerCase()

  if (transactionStatus === 'capture') {
    return fraudStatus === 'challenge' ? 'processing' : 'paid'
  }

  switch (transactionStatus) {
    case 'settlement':
      return 'paid'
    case 'pending':
      return 'awaiting_payment'
    case 'authorize':
      return 'processing'
    case 'deny':
    case 'failure':
      return 'failed'
    case 'expire':
      return 'expired'
    case 'cancel':
      return 'cancelled'
    default:
      return 'pending'
  }
}

export function getMidtransEventKey(payload: {
  order_id?: string
  transaction_id?: string
  transaction_status?: string
  fraud_status?: string
  status_code?: string
}): string {
  return [
    payload.order_id ?? 'unknown-order',
    payload.transaction_id ?? 'unknown-transaction',
    payload.transaction_status ?? 'unknown-status',
    payload.fraud_status ?? 'no-fraud-status',
    payload.status_code ?? 'no-status-code',
  ].join(':')
}

export function normalizeMidtransInstructions(
  response: MidtransChargeResponse | Record<string, any> | null | undefined,
): NormalizedMidtransPaymentInstructions {
  const actions = Array.isArray(response?.actions) ? response.actions : []
  const vaNumbers = Array.isArray(response?.va_numbers) ? response.va_numbers : []

  return {
    paymentType: typeof response?.payment_type === 'string' ? response.payment_type : null,
    transactionStatus:
      typeof response?.transaction_status === 'string'
        ? response.transaction_status
        : null,
    expiresAt: typeof response?.expiry_time === 'string' ? response.expiry_time : null,
    qrString: typeof response?.qr_string === 'string' ? response.qr_string : null,
    qrCodeUrl:
      actions.find((action) => action?.name === 'generate-qr-code')?.url ?? null,
    deeplinkUrl:
      actions.find((action) => action?.name === 'deeplink-redirect')?.url ?? null,
    permataVaNumber:
      typeof response?.permata_va_number === 'string'
        ? response.permata_va_number
        : null,
    vaNumbers: vaNumbers
      .filter(
        (item): item is { bank: string; va_number: string } =>
          typeof item?.bank === 'string' && typeof item?.va_number === 'string',
      )
      .map((item) => ({
        bank: item.bank,
        vaNumber: item.va_number,
      })),
    billKey: typeof response?.bill_key === 'string' ? response.bill_key : null,
    billerCode:
      typeof response?.biller_code === 'string' ? response.biller_code : null,
  }
}

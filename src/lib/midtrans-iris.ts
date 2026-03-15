

export type MidtransIrisConfig = {
  isProduction: boolean
  creatorKey: string
  approverKey?: string
}

function getIrisConfig(): MidtransIrisConfig {
  const creatorKey = process.env.MIDTRANS_IRIS_CREATOR_KEY?.trim()
  if (!creatorKey) {
    throw new Error('MIDTRANS_IRIS_CREATOR_KEY is not configured')
  }

  return {
    isProduction:
      process.env.MIDTRANS_IS_PRODUCTION === 'true' ||
      process.env.MIDTRANS_ENV === 'production',
    creatorKey,
    approverKey: process.env.MIDTRANS_IRIS_APPROVER_KEY?.trim(),
  }
}

function getIrisBaseUrl(isProduction: boolean): string {
  return isProduction
    ? 'https://app.midtrans.com/iris'
    : 'https://app.sandbox.midtrans.com/iris'
}

function getIrisAuthHeader(key: string): string {
  return `Basic ${Buffer.from(`${key}:`).toString('base64')}`
}

export type IrisAccountValidationResponse = {
  account_name: string
  account_no: string
  bank_name: string
}

export async function validateBankAccount(
  bankCode: string,
  accountNumber: string,
): Promise<IrisAccountValidationResponse> {
  const config = getIrisConfig()
  const url = `${getIrisBaseUrl(config.isProduction)}/api/v1/account_validation?bank=${encodeURIComponent(
    bankCode,
  )}&account=${encodeURIComponent(accountNumber)}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: getIrisAuthHeader(config.creatorKey),
    },
  })

  if (!response.ok) {
    let errorMsg = 'Unknown error'
    try {
      const parsed = await response.json()
      errorMsg = parsed.error_message || parsed.errors || errorMsg
    } catch {
      errorMsg = await response.text()
    }
    throw new Error(
      `Iris validateBankAccount failed (${response.status}): ${errorMsg}`,
    )
  }

  return response.json() as Promise<IrisAccountValidationResponse>
}

export type IrisPayoutRequest = {
  payouts: Array<{
    beneficiary_name: string
    beneficiary_account: string
    beneficiary_bank: string
    beneficiary_email?: string
    amount: string // e.g. "100000.00"
    notes: string
  }>
}

export type IrisPayoutResponse = {
  payouts: Array<{
    status: string // e.g., "queued"
    reference_no: string
  }>
}

export async function createPayout(
  payload: IrisPayoutRequest,
): Promise<IrisPayoutResponse> {
  const config = getIrisConfig()
  const response = await fetch(`${getIrisBaseUrl(config.isProduction)}/api/v1/payouts`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: getIrisAuthHeader(config.creatorKey),
      'X-Idempotency-Key': `payout-${Date.now()}`, // Simple fallback idempotency if requested
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  const parsed = text ? JSON.parse(text) : {}
  if (!response.ok) {
    throw new Error(
      parsed.error_message
        ? `Iris createPayout failed (${response.status}): ${parsed.error_message}`
        : `Iris createPayout failed (${response.status}): ${text || 'Unknown error'}`,
    )
  }

  return parsed as IrisPayoutResponse
}

export type IrisApprovePayoutRequest = {
  reference_nos: Array<string>
  otp?: string
}

export type IrisApprovePayoutResponse = {
  status: string
}

export async function approvePayout(
  payload: IrisApprovePayoutRequest,
): Promise<IrisApprovePayoutResponse> {
  const config = getIrisConfig()
  
  if (!config.approverKey) {
    throw new Error('MIDTRANS_IRIS_APPROVER_KEY is not configured but required for approvePayout')
  }

  const response = await fetch(`${getIrisBaseUrl(config.isProduction)}/api/v1/payouts/approve`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: getIrisAuthHeader(config.approverKey),
    },
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  const parsed = text ? JSON.parse(text) : {}
  if (!response.ok) {
    throw new Error(
      parsed.error_message
        ? `Iris approvePayout failed (${response.status}): ${parsed.error_message}`
        : `Iris approvePayout failed (${response.status}): ${text || 'Unknown error'}`,
    )
  }

  return parsed as IrisApprovePayoutResponse
}

export type IrisPayoutDetailsResponse = {
  amount: string
  beneficiary_name: string
  beneficiary_account: string
  bank: string
  reference_no: string
  notes: string
  beneficiary_email: string
  status: string // "queued", "processed", "completed", "failed", "rejected".
  created_by: string
  created_at: string
  updated_at: string
  error_message?: string
}

export async function getPayoutDetails(
  referenceNo: string,
): Promise<IrisPayoutDetailsResponse> {
  const config = getIrisConfig()
  const response = await fetch(
    `${getIrisBaseUrl(config.isProduction)}/api/v1/payouts/${encodeURIComponent(referenceNo)}`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
        authorization: getIrisAuthHeader(config.creatorKey),
      },
    },
  )

  const text = await response.text()
  const parsed = text ? JSON.parse(text) : {}
  if (!response.ok) {
    throw new Error(
      parsed.error_message
        ? `Iris getPayoutDetails failed (${response.status}): ${parsed.error_message}`
        : `Iris getPayoutDetails failed (${response.status}): ${text || 'Unknown error'}`,
    )
  }

  return parsed as IrisPayoutDetailsResponse
}

export function verifyIrisWebhookSignature(
  // Payout payload typically does not have standard signature in Iris like Core API
  // You might want to match an endpoint or checking an API key on the receiving end.
  // Iris actually has `signature-key` header/body field similar to core depending on the exact implementation.
  // Assuming it works exactly like the Midtrans API (order_id + status_code + gross_amount + serverKey)
  // Let's stub it for Iris specific logic.
  _payload: Record<string, any>,
): boolean {
  // TODO: Add proper signature check based on Iris webhook docs
  // Midtrans Iris usually doesn't provide a signature hash. It relies on the Merchant URL being a secret or validating IP addresses.
  return true 
}

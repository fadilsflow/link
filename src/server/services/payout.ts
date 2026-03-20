import { and, desc, eq, lte, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  PAYOUT_STATUS,
  TRANSACTION_TYPE,
  bankAccounts,
  payouts,
  transactions,
} from '@/db/schema'
import {
  approvePayout,
  createPayout,
  validateBankAccount,
} from '@/lib/midtrans-iris'

export async function getAvailableBalance(userId: string): Promise<number> {
  const [result] = await db
    .select({
      balance: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.creatorId, userId),
        lte(transactions.availableAt, new Date()),
      ),
    )

  return Number(result?.balance || 0)
}

export async function requestPayout(params: {
  userId: string
  amount: number // Requesting positive amount to withdraw
  notes?: string
}) {
  const { userId, amount, notes = 'Creator Payout' } = params

  if (amount <= 0) {
    throw new Error('Payout amount must be greater than zero')
  }

  // 1. Check if user already has a pending payout
  const existingPending = await db.query.payouts.findFirst({
    where: and(
      eq(payouts.creatorId, userId),
      eq(payouts.status, PAYOUT_STATUS.PENDING),
    ),
  })

  if (existingPending) {
    throw new Error('You already have a pending payout request.')
  }

  // 2. Check balance
  const availableBalance = await getAvailableBalance(userId)
  if (availableBalance < amount) {
    throw new Error(
      `Insufficient available balance. Available: ${availableBalance}, Requested: ${amount}`,
    )
  }

  // 3. Get Bank Account
  const bankAccount = await db.query.bankAccounts.findFirst({
    where: eq(bankAccounts.userId, userId),
    orderBy: [desc(bankAccounts.createdAt)],
  })

  if (!bankAccount) {
    throw new Error('No bank account found for withdrawal.')
  }

  // 4. Validate Bank Account via Iris
  try {
    const isValid = await validateBankAccount(
      bankAccount.bankCode,
      bankAccount.accountNumber,
    )
    if (!isValid.account_name) {
      throw new Error('Invalid bank account details according to Iris.')
    }
  } catch (err: any) {
    throw new Error(`Bank account validation failed: ${err.message}`)
  }

  const payoutId = crypto.randomUUID()

  try {
    // 5. Database Transaction (Lock funds & Create Payout Request)
    await db.transaction(async (tx) => {
      // Re-check balance inside transaction to prevent race conditions
      const [balanceResult] = await tx
        .select({
          balance: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.creatorId, userId),
            lte(transactions.availableAt, new Date()),
          ),
        )

      const currentBalance = Number(balanceResult?.balance || 0)
      if (currentBalance < amount) {
        throw new Error('Insufficient balance during transaction.')
      }

      // Create payout record
      await tx.insert(payouts).values({
        id: payoutId,
        creatorId: userId,
        amount,
        status: PAYOUT_STATUS.PENDING,
        notes: 'Withdrawal initiated',
        payoutMethod: 'bank_transfer',
        payoutDetails: {
          bankCode: bankAccount.bankCode,
          accountNumber: bankAccount.accountNumber,
        },
      })

      // Create debit transaction to lock funds
      await tx.insert(transactions).values({
        id: crypto.randomUUID(),
        creatorId: userId,
        payoutId,
        type: TRANSACTION_TYPE.PAYOUT,
        amount: -amount, // Negative for debit
        netAmount: -amount,
        platformFeePercent: 0,
        platformFeeAmount: 0,
        description: `Payout Withdrawal to ${bankAccount.bankName}`,
        availableAt: new Date(),
      })
    })
  } catch (err: any) {
    throw new Error(`Failed to initiate payout in database: ${err.message}`)
  }

  // 6. Request Payout via Midtrans Iris
  let referenceNo: string | undefined

  try {
    const irisResponse = await createPayout({
      payouts: [
        {
          beneficiary_name: bankAccount.accountName,
          beneficiary_account: bankAccount.accountNumber,
          beneficiary_bank: bankAccount.bankCode,
          amount: amount.toFixed(2), // Ensure string format
          notes: notes,
        },
      ],
    })

    if (irisResponse.payouts && irisResponse.payouts.length > 0) {
      referenceNo = irisResponse.payouts[0].reference_no

      await db
        .update(payouts)
        .set({
          status: PAYOUT_STATUS.PROCESSING,
          payoutDetails: {
            bankCode: bankAccount.bankCode,
            accountNumber: bankAccount.accountNumber,
            referenceNo,
          },
        })
        .where(eq(payouts.id, payoutId))

      // 7. Auto-approve payouts if configured
      if (process.env.MIDTRANS_IRIS_APPROVER_KEY) {
        try {
          await approvePayout({
            reference_nos: [referenceNo],
          })
          // The actual status update should happen via webhooks, but we can log logic here.
          await db
            .update(payouts)
            .set({ notes: 'Payout approved, awaiting bank processing' })
            .where(eq(payouts.id, payoutId))
        } catch (approvalError) {
          console.error('Iris Auto-Approve failed:', approvalError)
          // Don't fail the whole user request if auto-approve fails; it can still be manually approved.
          await db
            .update(payouts)
            .set({ notes: 'Auto-approval failed, manual approval required' })
            .where(eq(payouts.id, payoutId))
        }
      }
    } else {
      throw new Error('Iris returned empty payout response.')
    }
  } catch (err: any) {
    // If Iris request fails outright, revert the database changes.
    // We update the payout status to FAILED and reverse the debit transaction.
    console.error('Iris API createPayout failed:', err)

    await db.transaction(async (tx) => {
      await tx
        .update(payouts)
        .set({
          status: PAYOUT_STATUS.FAILED,
          failureReason: err.message || 'Midtrans Iris API Error',
        })
        .where(eq(payouts.id, payoutId))

      // Credit the funds back to available balance
      await tx.insert(transactions).values({
        id: crypto.randomUUID(),
        creatorId: userId,
        payoutId,
        type: TRANSACTION_TYPE.ADJUSTMENT,
        amount: amount, // Positive to refund the failed payout
        netAmount: amount,
        platformFeePercent: 0,
        platformFeeAmount: 0,
        description: `Refund for Failed Payout Withdrawal`,
        availableAt: new Date(), // Available immediately
      })
    })

    throw new Error(
      'Payout request to provider failed. Funds have been refunded.',
    )
  }

  return { payoutId, referenceNo }
}

export async function processIrisNotification(
  payload: any,
): Promise<{ found: boolean; duplicate?: boolean; status?: string }> {
  const referenceNo = payload?.reference_no
  const status = payload?.status

  if (!referenceNo || !status) {
    throw new Error('Missing reference_no or status in Iris payload')
  }

  // Find payout by referenceNo in JSON payoutDetails
  const targetPayout = await db.query.payouts.findFirst({
    where: sql`${payouts.payoutDetails}->>'referenceNo' = ${referenceNo}`,
  })

  if (!targetPayout) {
    return { found: false }
  }

  // Already settled statuses
  if (
    targetPayout.status === PAYOUT_STATUS.COMPLETED ||
    targetPayout.status === PAYOUT_STATUS.FAILED ||
    targetPayout.status === PAYOUT_STATUS.CANCELLED
  ) {
    return { found: true, duplicate: true, status: targetPayout.status }
  }

  let nextStatus = targetPayout.status
  let notes = targetPayout.notes

  if (status === 'completed' || status === 'processed') {
    nextStatus = PAYOUT_STATUS.COMPLETED
    notes = 'Payout completed successfully'
  } else if (status === 'failed' || status === 'rejected') {
    nextStatus = PAYOUT_STATUS.FAILED
    notes = `Payout failed: ${payload.error_message || 'Bank rejected'}`
  }

  if (nextStatus !== targetPayout.status) {
    await db.transaction(async (tx) => {
      await tx
        .update(payouts)
        .set({
          status: nextStatus,
          notes,
          processedAt: new Date(),
          failureReason:
            nextStatus === PAYOUT_STATUS.FAILED
              ? payload.error_message || 'Bank rejected'
              : undefined,
        })
        .where(eq(payouts.id, targetPayout.id))

      // If failed, we must refund the user's available balance
      if (nextStatus === PAYOUT_STATUS.FAILED) {
        await tx.insert(transactions).values({
          id: crypto.randomUUID(),
          creatorId: targetPayout.creatorId,
          payoutId: targetPayout.id,
          type: TRANSACTION_TYPE.ADJUSTMENT,
          amount: targetPayout.amount, // Positive to refund
          netAmount: targetPayout.amount,
          platformFeePercent: 0,
          platformFeeAmount: 0,
          description: `Refund for Failed Payout Withdrawal`,
          availableAt: new Date(),
        })
      }
    })
  }

  return { found: true, duplicate: false, status: nextStatus }
}

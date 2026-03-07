import { NextRequest, NextResponse } from 'next/server'
import { RevenueCatEvent } from '@/lib/type'
import {
  handleCancellation,
  handleInitialPurchase,
  handleRenewal,
  isValidProduct,
} from '@/actions/payment/helper'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET

    if (!authHeader || authHeader !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: RevenueCatEvent = await req.json()
    const { type, app_user_id, product_id } = body.event

    // --- CHECK PRODUCT BEFORE WRITING ---
    const isAllowed = await isValidProduct(product_id)
    if (!isAllowed) {
      console.warn(
        `⚠️ Rejected: Product ID "${product_id}" not found in examPaymentData.`,
      )
      return NextResponse.json({ error: 'Unknown Product' }, { status: 400 })
    }

    console.log(
      `✅ Valid Product: ${product_id}. Processing ${type} for ${app_user_id}`,
    )
    console.log(`RC Webhook Received: ${type} for User: ${app_user_id}`)

    switch (type) {
      case 'INITIAL_PURCHASE':
        await handleInitialPurchase(body.event)
        break

      case 'RENEWAL':
        await handleRenewal(body.event)
        break

      case 'CANCELLATION':
        // CANCELLATION in RC means the subscription won't renew or was refunded
        await handleCancellation(body.event)
        break

      default:
        console.log(`Unhandled event type: ${type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    console.error('Webhook Error:', err)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    )
  }
}

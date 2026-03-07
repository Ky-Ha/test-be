import { db } from '@/lib/db'
import { examPaymentData, userOrders } from '@/lib/db/schema'
import { RevenueCatEvent } from '@/lib/type'
import { eq } from 'drizzle-orm'

// check invalid product
export async function isValidProduct(productId: string) {
  const product = await db
    .select()
    .from(examPaymentData)
    .where(eq(examPaymentData.productId, productId))
    .limit(1)

  return product.length > 0
}

export async function handleInitialPurchase(event: any) {
  console.log(`Processing Initial Purchase for ${event.app_user_id}`)

  console.log('event: ', event)

  await db.insert(userOrders).values({
    id: crypto.randomUUID(),
    userId: event.app_user_id,
    rcAppUserId: event.app_user_id,
    rcTransactionId: event.transaction_id,
    type: 'INITIAL_PURCHASE',
    productId: event.product_id,
    entitlementIds: event.entitlement_ids,
    status: 'active',
    price: Number(event.price),
    currency: event.currency,
    store: event.store,
    environment: event.environment,
    expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
    purchasedAt: event.purchased_at_ms ? new Date(event.purchased_at_ms) : null,
  })
}

export async function handleRenewal(event: any) {
  console.log(`Processing Renewal for ${event.app_user_id}`)

  await db
    .insert(userOrders)
    .values({
      id: crypto.randomUUID(),
      userId: event.app_user_id,
      rcAppUserId: event.app_user_id,
      rcTransactionId: event.transaction_id,
      type: 'RENEWAL',
      status: 'active',
      productId: event.product_id,
      entitlementIds: event.entitlement_ids,
      price: Number(event.price),
      currency: event.currency,
      store: event.store,
      environment: event.environment,
      expiresAt: event.expiration_at_ms
        ? new Date(event.expiration_at_ms)
        : null,
      purchasedAt: event.purchased_at_ms
        ? new Date(event.purchased_at_ms)
        : null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userOrders.rcTransactionId, // If this ID already exists...
      set: {
        // ...just update the timestamps and status
        type: 'RENEWAL',
        status: 'active',
        expiresAt: event.expiration_at_ms
          ? new Date(event.expiration_at_ms)
          : null,
        updatedAt: new Date(),
      },
    })
}

export async function handleCancellation(event: RevenueCatEvent['event']) {
  // We update the record by the app_user_id and store the reason
  // Note: We use rcAppUserId to find the current active subscription
  await db
    .update(userOrders)
    .set({
      status: 'cancelled',
      type: 'CANCELLATION',
      cancelReason: event.cancel_reason || 'USER_INITIATED',
      expiresAt: event.event_timestamp_ms
        ? new Date(event.event_timestamp_ms)
        : null,
      updatedAt: new Date(),
    })
    .where(eq(userOrders.rcAppUserId, event.app_user_id))
}

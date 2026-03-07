export type InviteUser = {
  id: string
  email: string
}

export interface RevenueCatEvent {
  event: {
    type: 'INITIAL_PURCHASE' | 'RENEWAL' | 'CANCELLATION' | string
    app_user_id: string
    product_id: string
    transaction_id: string
    entitlement_ids: string[]
    price: number
    currency: string
    expiration_at_ms: number
    purchased_at_ms: number
    cancel_reason?: string
    environment: string
    store: string
    event_timestamp_ms: number
  }
}
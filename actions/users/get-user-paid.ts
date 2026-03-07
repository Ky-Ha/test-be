import { userOrders } from '@/lib/db/schema'
import { getCurrentUser } from './current-user'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'

export const doesUserBuyApp = async () => {
  const currentUser = await getCurrentUser()

  // Return early if no user is found
  if (!currentUser) {
    return { isPaid: false, isFreeGeneration: false, currentUser: currentUser }
  }

  // 1. Check Subscription/Order Status
  const [latestOrder] = await db
    .select()
    .from(userOrders)
    .where(eq(userOrders.userId, currentUser.id))
    .orderBy(desc(userOrders.expiresAt))
    .limit(1)

  const isPaid = !!(
    latestOrder?.expiresAt && latestOrder.expiresAt.getTime() > Date.now()
  )

  // 2. Check Free Tier Status
  // Assuming 'freeGenerationUsed' tracks if they've exhausted their free credits
  const isFreeGeneration = !currentUser.freeGenerationUsed

  return { isPaid, isFreeGeneration, currentUser }
}

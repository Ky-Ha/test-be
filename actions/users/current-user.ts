'use server'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

export const getCurrentUser = async () => {
  const { userId } = await auth()
  if (!userId) return null

  const rs = await db.select().from(users).where(eq(users.clerkUserId, userId))

  return rs[0]
}

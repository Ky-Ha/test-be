import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { nanoid } from '@/lib/utils'

export type ONBOARDING_USER_META = {
  clerkUserId: string
  firstName?: string
  lastName?: string
  email: string
  avatarUrl?: string
}

export type UPDATE_USER_META = {
  name?: string
  email?: string
  avatarUrl?: string
  firstName?: string
  lastName?: string
}

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local',
    )
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Get the ID and type
  const { id } = evt.data
  const eventType = evt.type

  if (eventType === 'user.created') {
    try {
      const onboardingUser: ONBOARDING_USER_META = {
        email: JSON.parse(body).data.email_addresses[0].email_address,
        firstName: JSON.parse(body).data.first_name,
        lastName: JSON.parse(body).data.last_name,
        avatarUrl: JSON.parse(body).data.image_url,
        clerkUserId: JSON.parse(body).data.id,
      }
      // create new user here
      await db.insert(users).values({
        id: nanoid(),
        ...onboardingUser,
      })
      return new Response('', { status: 200 })
    } catch {
      return new Response('', { status: 501 })
    }
  }
  if (eventType === 'user.updated') {
    try {
      const updateUser: UPDATE_USER_META = {
        email:
          JSON.parse(body).data.email_addresses[0].email_address ?? undefined,
        firstName: JSON.parse(body).data.first_name ?? undefined,
        lastName: JSON.parse(body).data.last_name ?? undefined,
        avatarUrl: JSON.parse(body).data.image_url ?? undefined,
      }
      // get clerkUserId
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, JSON.parse(body).data.id))
      if (!existingUser || existingUser.length === 0) {
        throw new Error('No user found.')
      }
      await db
        .update(users)
        .set({
          ...updateUser,
        })
        .where(eq(users.id, existingUser[0].id))
      return new Response('', { status: 200 })
    } catch (error) {
      console.log('error update user: ', error)
      return new Response('', { status: 501 })
    }
  }
  if (eventType === 'user.deleted') {
    // IMPORTANCE: DELETE A USER WILL DELETE ALL RESOURCES THE USER MANAGE (WORKSPACES)
    try {
      // get clerkUserId
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, JSON.parse(body).data.id))

      if (!existingUser || existingUser.length === 0) {
        throw new Error('No user found.')
      }
      await db.delete(users).where(eq(users.id, existingUser[0].id))
      return new Response('', { status: 200 })
    } catch (error) {
      console.log('error update user: ', error)
      return new Response('', { status: 501 })
    }
  }
  return new Response('', { status: 200 })
}

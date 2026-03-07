import {
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  pgEnum,
  primaryKey,
  boolean,
  varchar,
  doublePrecision,
  integer,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export type UserRole = 'admin' | 'user'

// --- USERS ---
// ID is a string because it maps directly to Clerk's User ID (e.g., 'user_2b...')
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  clerkUserId: text('clerk_user_id').unique().notNull(),
  email: text('email').notNull(),
  role: text('role').$type<UserRole>().default('user'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: timestamp('created_at').defaultNow(),
  avatarUrl: text('avatar_url'),
  nickname: text('nick_name'),
  avatarUserChooseUrl: text('avatar_user_choose_url'),
})

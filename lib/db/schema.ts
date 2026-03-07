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
  freeGenerationUsed: boolean('free_generation_used').default(false),
})

export const generationResults = pgTable('generation_results', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  bodyImageUrl: text('body_image_url'),
  itemImageUrl: text('item_image_url'),

  resultImageUrl: text('result_image_url').notNull(),
  description: text('description'),

  // true if user's free generation
  isFreeGeneration: boolean('is_free_generation').default(false),

  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const generationRequests = pgTable('generation_requests', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  bodyImageUrl: text('body_image_url'),
  itemImageUrl: text('item_image_url'),
  description: text('description'),

  status: varchar('status', { length: 50 }),

  error: text('error'),

  createdAt: timestamp('created_at').defaultNow(),
})

export const userOrders = pgTable('user_orders', {
  id: uuid('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }), // Ensure users table exists
  rcAppUserId: varchar('rc_app_user_id', { length: 256 }).notNull(),
  rcTransactionId: varchar('rc_transaction_id', { length: 256 }).unique(),
  type: varchar('type', { length: 50 }),
  productId: varchar('product_id', { length: 256 }),
  entitlementIds: text('entitlement_ids').array(),
  status: varchar('status', { length: 50 }),
  cancelReason: varchar('cancel_reason', { length: 255 }),
  price: doublePrecision('price'),
  currency: varchar('currency', { length: 10 }),
  store: varchar('store', { length: 50 }), // <--- ADD THIS
  environment: varchar('environment', { length: 50 }), // <--- ADD THIS
  expiresAt: timestamp('expires_at'),
  purchasedAt: timestamp('purchased_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type ModePayment = 'monthly' | 'annually'

export const examPaymentData = pgTable('exam_payment_data', {
  id: uuid('id').primaryKey(),
  productId: text('product_id'),
  mode: text('mode').$type<ModePayment>(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

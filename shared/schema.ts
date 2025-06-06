import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique().notNull(),
  followersCount: integer("followers_count").default(0),
  followingCount: integer("following_count").default(0),
  bio: text("bio"),
  coins: integer("coins").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  videoUrl: varchar("video_url").notNull(),
  thumbnailUrl: varchar("thumbnail_url"),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  sharesCount: integer("shares_count").default(0),
  giftsCount: integer("gifts_count").default(0),
  views: integer("views").default(0),
  duration: integer("duration"), // in seconds
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoId: integer("video_id").references(() => videos.id),
  commentId: integer("comment_id").references(() => comments.id),
  type: varchar("type").notNull(), // 'video' or 'comment'
  createdAt: timestamp("created_at").defaultNow(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gifts = pgTable("gifts", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  videoId: integer("video_id").references(() => videos.id),
  liveStreamId: integer("live_stream_id").references(() => liveStreams.id),
  giftType: varchar("gift_type").notNull(), // 'rose', 'diamond', 'crown', 'rocket', etc.
  amount: integer("amount").notNull(), // cost in coins
  coinCost: integer("coin_cost").notNull(),
  rarity: varchar("rarity").notNull().default("common"), // 'common', 'rare', 'epic', 'legendary'
  emoji: varchar("emoji").notNull(),
  name: varchar("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const coins = pgTable("coins", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const coinTransactions = pgTable("coin_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // 'purchase', 'gift_sent', 'gift_received', 'earnings'
  amount: integer("amount").notNull(),
  description: varchar("description"),
  relatedId: integer("related_id"), // gift id, purchase id, etc
  createdAt: timestamp("created_at").defaultNow(),
});

export const coinPurchases = pgTable("coin_purchases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  packageType: varchar("package_type").notNull(),
  coinAmount: integer("coin_amount").notNull(),
  priceUsd: varchar("price_usd").notNull(),
  status: varchar("status").default("pending"), // 'pending', 'completed', 'failed'
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const liveStreams = pgTable("live_streams", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url"),
  streamKey: varchar("stream_key").notNull(),
  isActive: boolean("is_active").default(false),
  viewerCount: integer("viewer_count").default(0),
  totalGifts: integer("total_gifts").default(0),
  totalCoins: integer("total_coins").default(0),
  category: varchar("category").default("general"),
  tags: varchar("tags").array(),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const liveViewers = pgTable("live_viewers", {
  id: serial("id").primaryKey(),
  liveStreamId: integer("live_stream_id").notNull().references(() => liveStreams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});

export const liveMessages = pgTable("live_messages", {
  id: serial("id").primaryKey(),
  liveStreamId: integer("live_stream_id").notNull().references(() => liveStreams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  type: varchar("type").default("chat"), // 'chat', 'gift', 'system'
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  videos: many(videos),
  comments: many(comments),
  likes: many(likes),
  sentGifts: many(gifts, { relationName: "sentGifts" }),
  receivedGifts: many(gifts, { relationName: "receivedGifts" }),
  followers: many(follows, { relationName: "followers" }),
  following: many(follows, { relationName: "following" }),
  coins: one(coins),
  coinTransactions: many(coinTransactions),
  coinPurchases: many(coinPurchases),
  liveStreams: many(liveStreams),
  liveViewers: many(liveViewers),
  liveMessages: many(liveMessages),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  user: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
  gifts: many(gifts),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [comments.videoId],
    references: [videos.id],
  }),
  likes: many(likes),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [likes.videoId],
    references: [videos.id],
  }),
  comment: one(comments, {
    fields: [likes.commentId],
    references: [comments.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "followers",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

export const giftsRelations = relations(gifts, ({ one }) => ({
  sender: one(users, {
    fields: [gifts.senderId],
    references: [users.id],
    relationName: "sentGifts",
  }),
  receiver: one(users, {
    fields: [gifts.receiverId],
    references: [users.id],
    relationName: "receivedGifts",
  }),
  video: one(videos, {
    fields: [gifts.videoId],
    references: [videos.id],
  }),
  liveStream: one(liveStreams, {
    fields: [gifts.liveStreamId],
    references: [liveStreams.id],
  }),
}));

export const coinsRelations = relations(coins, ({ one, many }) => ({
  user: one(users, {
    fields: [coins.userId],
    references: [users.id],
  }),
  transactions: many(coinTransactions),
}));

export const coinTransactionsRelations = relations(coinTransactions, ({ one }) => ({
  user: one(users, {
    fields: [coinTransactions.userId],
    references: [users.id],
  }),
  coins: one(coins, {
    fields: [coinTransactions.userId],
    references: [coins.userId],
  }),
}));

export const coinPurchasesRelations = relations(coinPurchases, ({ one }) => ({
  user: one(users, {
    fields: [coinPurchases.userId],
    references: [users.id],
  }),
}));

export const liveStreamsRelations = relations(liveStreams, ({ one, many }) => ({
  user: one(users, {
    fields: [liveStreams.userId],
    references: [users.id],
  }),
  viewers: many(liveViewers),
  messages: many(liveMessages),
  gifts: many(gifts),
}));

export const liveViewersRelations = relations(liveViewers, ({ one }) => ({
  user: one(users, {
    fields: [liveViewers.userId],
    references: [users.id],
  }),
  liveStream: one(liveStreams, {
    fields: [liveViewers.liveStreamId],
    references: [liveStreams.id],
  }),
}));

export const liveMessagesRelations = relations(liveMessages, ({ one }) => ({
  user: one(users, {
    fields: [liveMessages.userId],
    references: [users.id],
  }),
  liveStream: one(liveStreams, {
    fields: [liveMessages.liveStreamId],
    references: [liveStreams.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
  likesCount: true,
  commentsCount: true,
  sharesCount: true,
  giftsCount: true,
  views: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  likesCount: true,
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertGiftSchema = createInsertSchema(gifts).omit({
  id: true,
  createdAt: true,
});

export const insertCoinSchema = createInsertSchema(coins).omit({
  id: true,
  updatedAt: true,
});

export const insertCoinTransactionSchema = createInsertSchema(coinTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertCoinPurchaseSchema = createInsertSchema(coinPurchases).omit({
  id: true,
  createdAt: true,
});

export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  endedAt: true,
});

export const insertLiveViewerSchema = createInsertSchema(liveViewers).omit({
  id: true,
  joinedAt: true,
  leftAt: true,
});

export const insertLiveMessageSchema = createInsertSchema(liveMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Gift = typeof gifts.$inferSelect;
export type InsertGift = z.infer<typeof insertGiftSchema>;
export type Coin = typeof coins.$inferSelect;
export type InsertCoin = z.infer<typeof insertCoinSchema>;
export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type InsertCoinTransaction = z.infer<typeof insertCoinTransactionSchema>;
export type CoinPurchase = typeof coinPurchases.$inferSelect;
export type InsertCoinPurchase = z.infer<typeof insertCoinPurchaseSchema>;
export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type LiveViewer = typeof liveViewers.$inferSelect;
export type InsertLiveViewer = z.infer<typeof insertLiveViewerSchema>;
export type LiveMessage = typeof liveMessages.$inferSelect;
export type InsertLiveMessage = z.infer<typeof insertLiveMessageSchema>;

import {
  users,
  videos,
  comments,
  likes,
  follows,
  gifts,
  type User,
  type UpsertUser,
  type Video,
  type InsertVideo,
  type Comment,
  type InsertComment,
  type Like,
  type InsertLike,
  type Follow,
  type InsertFollow,
  type Gift,
  type InsertGift,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserCoins(userId: string, amount: number): Promise<User>;
  
  // Video operations
  getVideos(limit?: number, offset?: number): Promise<Video[]>;
  getVideoById(id: number): Promise<Video | undefined>;
  getVideosByUserId(userId: string): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideoStats(videoId: number, field: 'likesCount' | 'commentsCount' | 'sharesCount' | 'giftsCount' | 'views', increment: number): Promise<void>;
  
  // Comment operations
  getCommentsByVideoId(videoId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Like operations
  getLikeByUserAndVideo(userId: string, videoId: number): Promise<Like | undefined>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(userId: string, videoId: number, type: string): Promise<void>;
  
  // Follow operations
  getFollowByUsers(followerId: string, followingId: string): Promise<Follow | undefined>;
  createFollow(follow: InsertFollow): Promise<Follow>;
  deleteFollow(followerId: string, followingId: string): Promise<void>;
  
  // Gift operations
  createGift(gift: InsertGift): Promise<Gift>;
  getGiftsByVideoId(videoId: number): Promise<Gift[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        username: userData.username || `user_${userData.id}`,
        coins: userData.coins || 0,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserCoins(userId: string, amount: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        coins: sql`${users.coins} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Video operations
  async getVideos(limit = 20, offset = 0): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .where(eq(videos.isPublic, true))
      .orderBy(desc(videos.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getVideoById(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async getVideosByUserId(userId: string): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(desc(videos.createdAt));
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [newVideo] = await db.insert(videos).values(video).returning();
    return newVideo;
  }

  async updateVideoStats(videoId: number, field: 'likesCount' | 'commentsCount' | 'sharesCount' | 'giftsCount' | 'views', increment: number): Promise<void> {
    await db
      .update(videos)
      .set({
        [field]: sql`${videos[field]} + ${increment}`,
      })
      .where(eq(videos.id, videoId));
  }

  // Comment operations
  async getCommentsByVideoId(videoId: number): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.videoId, videoId))
      .orderBy(desc(comments.createdAt));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    
    // Update video comment count
    await this.updateVideoStats(comment.videoId, 'commentsCount', 1);
    
    return newComment;
  }

  // Like operations
  async getLikeByUserAndVideo(userId: string, videoId: number): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.videoId, videoId),
          eq(likes.type, 'video')
        )
      );
    return like;
  }

  async createLike(like: InsertLike): Promise<Like> {
    const [newLike] = await db.insert(likes).values(like).returning();
    
    // Update video like count if it's a video like
    if (like.type === 'video' && like.videoId) {
      await this.updateVideoStats(like.videoId, 'likesCount', 1);
    }
    
    return newLike;
  }

  async deleteLike(userId: string, videoId: number, type: string): Promise<void> {
    await db
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.videoId, videoId),
          eq(likes.type, type)
        )
      );
    
    // Update video like count if it's a video like
    if (type === 'video') {
      await this.updateVideoStats(videoId, 'likesCount', -1);
    }
  }

  // Follow operations
  async getFollowByUsers(followerId: string, followingId: string): Promise<Follow | undefined> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    return follow;
  }

  async createFollow(follow: InsertFollow): Promise<Follow> {
    const [newFollow] = await db.insert(follows).values(follow).returning();
    
    // Update user follow counts
    await db
      .update(users)
      .set({
        followingCount: sql`${users.followingCount} + 1`,
      })
      .where(eq(users.id, follow.followerId));
    
    await db
      .update(users)
      .set({
        followersCount: sql`${users.followersCount} + 1`,
      })
      .where(eq(users.id, follow.followingId));
    
    return newFollow;
  }

  async deleteFollow(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );
    
    // Update user follow counts
    await db
      .update(users)
      .set({
        followingCount: sql`${users.followingCount} - 1`,
      })
      .where(eq(users.id, followerId));
    
    await db
      .update(users)
      .set({
        followersCount: sql`${users.followersCount} - 1`,
      })
      .where(eq(users.id, followingId));
  }

  // Gift operations
  async createGift(gift: InsertGift): Promise<Gift> {
    const [newGift] = await db.insert(gifts).values(gift).returning();
    
    // Update video gift count
    await this.updateVideoStats(gift.videoId, 'giftsCount', 1);
    
    return newGift;
  }

  async getGiftsByVideoId(videoId: number): Promise<Gift[]> {
    return await db
      .select()
      .from(gifts)
      .where(eq(gifts.videoId, videoId))
      .orderBy(desc(gifts.createdAt));
  }
}

export const storage = new DatabaseStorage();

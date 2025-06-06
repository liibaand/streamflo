import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertVideoSchema, insertCommentSchema, insertLikeSchema, insertFollowSchema, insertGiftSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({ dest: "uploads/" });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Video routes
  app.get('/api/videos', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const videos = await storage.getVideos(limit, offset);
      
      // Get user info for each video
      const videosWithUsers = await Promise.all(
        videos.map(async (video) => {
          const user = await storage.getUser(video.userId);
          return { ...video, user };
        })
      );
      
      res.json(videosWithUsers);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.get('/api/videos/:id', async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideoById(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      const user = await storage.getUser(video.userId);
      res.json({ ...video, user });
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  app.post('/api/videos', isAuthenticated, upload.single('video'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, isPublic } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "Video file is required" });
      }
      
      // In a real app, you'd upload to cloud storage
      const videoUrl = `/uploads/${req.file.filename}`;
      
      const videoData = insertVideoSchema.parse({
        userId,
        title,
        description,
        videoUrl,
        isPublic: isPublic !== 'false',
      });
      
      const video = await storage.createVideo(videoData);
      res.json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ message: "Failed to create video" });
    }
  });

  app.get('/api/users/:userId/videos', async (req, res) => {
    try {
      const { userId } = req.params;
      const videos = await storage.getVideosByUserId(userId);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching user videos:", error);
      res.status(500).json({ message: "Failed to fetch user videos" });
    }
  });

  // Comment routes
  app.get('/api/videos/:videoId/comments', async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const comments = await storage.getCommentsByVideoId(videoId);
      
      // Get user info for each comment
      const commentsWithUsers = await Promise.all(
        comments.map(async (comment) => {
          const user = await storage.getUser(comment.userId);
          return { ...comment, user };
        })
      );
      
      res.json(commentsWithUsers);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/videos/:videoId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const videoId = parseInt(req.params.videoId);
      const { content } = req.body;
      
      const commentData = insertCommentSchema.parse({
        userId,
        videoId,
        content,
      });
      
      const comment = await storage.createComment(commentData);
      const user = await storage.getUser(userId);
      
      res.json({ ...comment, user });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Like routes
  app.post('/api/videos/:videoId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const videoId = parseInt(req.params.videoId);
      
      const existingLike = await storage.getLikeByUserAndVideo(userId, videoId);
      
      if (existingLike) {
        await storage.deleteLike(userId, videoId, 'video');
        res.json({ liked: false });
      } else {
        const likeData = insertLikeSchema.parse({
          userId,
          videoId,
          type: 'video',
        });
        
        await storage.createLike(likeData);
        res.json({ liked: true });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.get('/api/videos/:videoId/like-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const videoId = parseInt(req.params.videoId);
      
      const like = await storage.getLikeByUserAndVideo(userId, videoId);
      res.json({ liked: !!like });
    } catch (error) {
      console.error("Error checking like status:", error);
      res.status(500).json({ message: "Failed to check like status" });
    }
  });

  // Follow routes
  app.post('/api/users/:userId/follow', isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.userId;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      const existingFollow = await storage.getFollowByUsers(followerId, followingId);
      
      if (existingFollow) {
        await storage.deleteFollow(followerId, followingId);
        res.json({ following: false });
      } else {
        const followData = insertFollowSchema.parse({
          followerId,
          followingId,
        });
        
        await storage.createFollow(followData);
        res.json({ following: true });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ message: "Failed to toggle follow" });
    }
  });

  // Gift routes
  app.post('/api/videos/:videoId/gift', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const videoId = parseInt(req.params.videoId);
      const { giftType, amount, receiverId, rarity, emoji, name } = req.body;
      
      const giftData = insertGiftSchema.parse({
        senderId,
        receiverId,
        videoId,
        giftType,
        amount,
        rarity: rarity || 'common',
        emoji: emoji || '🎁',
        name: name || 'Gift',
      });
      
      const gift = await storage.createGift(giftData);
      
      // Get sender info for real-time broadcast
      const sender = await storage.getUser(senderId);
      
      // Broadcast gift to all connected clients
      const giftMessage = {
        type: 'gift',
        videoId,
        data: {
          gift: {
            id: giftType,
            emoji,
            name,
            amount,
            rarity
          },
          sender: {
            username: sender?.username || 'Anonymous',
            profileImageUrl: sender?.profileImageUrl
          }
        },
        timestamp: new Date().toISOString()
      };
      
      // Broadcast to WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(giftMessage));
        }
      });
      
      res.json(gift);
    } catch (error) {
      console.error("Error sending gift:", error);
      res.status(500).json({ message: "Failed to send gift" });
    }
  });

  // Update video views
  app.post('/api/videos/:videoId/view', async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      await storage.updateVideoStats(videoId, 'views', 1);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating video views:", error);
      res.status(500).json({ message: "Failed to update views" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  
  // WebSocket server for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Broadcast to all connected clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}

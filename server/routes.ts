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
      let videos = await storage.getVideos(limit, offset);
      
      // Add sample videos if database is empty
      if (videos.length === 0 && offset === 0) {
        const currentUser = (req.user as any)?.claims?.sub || 'demo-user';
        
        const sampleVideos = [
          {
            userId: currentUser,
            title: 'Amazing Dance Moves',
            description: 'Check out these incredible dance moves! Perfect for the weekend vibes.',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            thumbnailUrl: 'https://picsum.photos/400/600?random=1',
            duration: 15,
            hashtags: ['dance', 'trending', 'viral'],
            musicInfo: 'Trending Beat - Dance Mix',
            isPrivate: false,
            allowComments: true,
            allowDownloads: true
          },
          {
            userId: currentUser,
            title: 'Cooking Life Hack',
            description: 'This simple kitchen trick will change how you cook forever!',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            thumbnailUrl: 'https://picsum.photos/400/600?random=2',
            duration: 12,
            hashtags: ['cooking', 'lifehack', 'tips'],
            musicInfo: 'Kitchen Vibes - Cooking Beats',
            isPrivate: false,
            allowComments: true,
            allowDownloads: true
          },
          {
            userId: currentUser,
            title: 'Travel Adventure',
            description: 'Exploring hidden gems around the world. Where should I go next?',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            thumbnailUrl: 'https://picsum.photos/400/600?random=3',
            duration: 20,
            hashtags: ['travel', 'adventure', 'explore'],
            musicInfo: 'Adventure Time - Travel Mix',
            isPrivate: false,
            allowComments: true,
            allowDownloads: true
          }
        ];

        for (const videoData of sampleVideos) {
          try {
            await storage.createVideo(videoData);
          } catch (error) {
            console.log('Sample video creation skipped:', (error as Error).message);
          }
        }
        
        videos = await storage.getVideos(limit, offset);
      }
      
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
      
      if (isNaN(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
      }
      
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

  // Discover routes
  app.get('/api/discover', async (req, res) => {
    try {
      const { category, search } = req.query;
      let videos = await storage.getVideos(20, 0);
      
      // Get user info for each video
      const videosWithUsers = await Promise.all(
        videos.map(async (video) => {
          const user = await storage.getUser(video.userId);
          return { ...video, user };
        })
      );
      
      res.json(videosWithUsers);
    } catch (error) {
      console.error("Error fetching discover content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  // Live streaming routes
  app.get('/api/live', async (req, res) => {
    try {
      const liveStreams = [
        {
          id: 1,
          title: "Gaming Session",
          viewers: 1250,
          user: { username: "gamer123", profileImageUrl: null },
          thumbnail: "https://picsum.photos/400/600?random=live1"
        },
        {
          id: 2,
          title: "Cooking Show",
          viewers: 890,
          user: { username: "chef_master", profileImageUrl: null },
          thumbnail: "https://picsum.photos/400/600?random=live2"
        }
      ];
      res.json(liveStreams);
    } catch (error) {
      console.error("Error fetching live streams:", error);
      res.status(500).json({ message: "Failed to fetch live streams" });
    }
  });

  app.post('/api/live/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description } = req.body;
      
      const streamKey = `stream_${userId}_${Date.now()}`;
      
      res.json({
        streamKey,
        streamUrl: `rtmp://localhost:1935/live/${streamKey}`,
        playbackUrl: `http://localhost:8080/live/${streamKey}/index.m3u8`
      });
    } catch (error) {
      console.error("Error starting live stream:", error);
      res.status(500).json({ message: "Failed to start live stream" });
    }
  });

  app.post('/api/live/end', isAuthenticated, async (req, res) => {
    try {
      res.json({ success: true });
    } catch (error) {
      console.error("Error ending live stream:", error);
      res.status(500).json({ message: "Failed to end live stream" });
    }
  });

  // Coin system routes
  app.get('/api/coins/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      res.json({
        amount: user?.coins || 0,
        totalSpent: 0,
        totalEarned: 0
      });
    } catch (error) {
      console.error("Error fetching coin balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  app.get('/api/coins/transactions', isAuthenticated, async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/coins/purchase', isAuthenticated, async (req: any, res) => {
    try {
      const { packageType, coinAmount, priceUsd } = req.body;
      const userId = req.user.claims.sub;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${coinAmount} Coins Package`,
                description: `${packageType} package - ${coinAmount} coins`,
              },
              unit_amount: Math.round(parseFloat(priceUsd) * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.get('origin')}/coins?success=true`,
        cancel_url: `${req.get('origin')}/coins?canceled=true`,
        metadata: {
          userId,
          packageType,
          coinAmount: coinAmount.toString(),
        },
      });

      res.json({
        success: true,
        checkoutUrl: session.url,
      });
    } catch (error) {
      console.error("Error purchasing coins:", error);
      res.status(500).json({ message: "Failed to purchase coins" });
    }
  });

  // Profile routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const videos = await storage.getVideosByUserId(userId);
      res.json({ ...user, videos });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

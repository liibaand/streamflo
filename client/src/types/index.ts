export interface VideoWithUser {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  giftCount: number;
  musicInfo: string | null;
  hashtags: string[] | null;
  isPrivate: boolean;
  allowComments: boolean;
  allowDownloads: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string | null;
    profileImageUrl: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface CommentWithUser {
  id: number;
  userId: string;
  videoId: number;
  parentId: number | null;
  content: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string | null;
    profileImageUrl: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}

export interface GiftType {
  id: number;
  name: string;
  emoji: string;
  price: number;
  rarity: string;
  animationType: string;
}

export interface GiftAnimationData {
  id: string;
  gift: GiftType;
  x: number;
  y: number;
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'gift' | 'like' | 'comment' | 'view';
  data: any;
  videoId?: number;
  userId?: string;
}

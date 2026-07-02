'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  BadgeCheck, Crown, Megaphone, Briefcase, CalendarDays,
  Loader2, Send, Trash2
} from 'lucide-react';
import { getCompanyPortfolioPath } from '@/lib/companyPortfolio';

export interface SocialPostData {
  id: string;
  authorId: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  content: string;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  postType: 'general' | 'offer' | 'hiring' | 'event';
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isPinned: boolean;
  createdAt: any;
  companySlug?: string;
  isVerified?: boolean;
  isPremium?: boolean;
}

export interface SocialPostProps {
  post: SocialPostData;
  isLiked?: boolean;
  isSaved?: boolean;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string, text: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  likeLoading?: boolean;
}

const POST_TYPE_CONFIG = {
  general: { icon: MessageCircle, label: 'Update', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  offer: { icon: Megaphone, label: 'Offer', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  hiring: { icon: Briefcase, label: 'Hiring', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  event: { icon: CalendarDays, label: 'Event', color: 'text-violet-400', bg: 'bg-violet-500/10' },
};

function timeAgo(timestamp: any): string {
  if (!timestamp) return 'Just now';
  const ms = typeof timestamp?.toMillis === 'function' ? timestamp.toMillis() : new Date(timestamp).getTime();
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(ms).toLocaleDateString();
}

export function SocialPost({
  post,
  isLiked = false,
  isSaved = false,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onSave,
  onDelete,
  likeLoading = false,
}: SocialPostProps) {
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);

  const typeConfig = POST_TYPE_CONFIG[post.postType] || POST_TYPE_CONFIG.general;
  const TypeIcon = typeConfig.icon;
  const isOwner = currentUserId === post.authorId;
  const companyPath = getCompanyPortfolioPath({
    id: post.companyId,
    slug: post.companySlug,
    name: post.companyName,
  });

  const handleSubmitComment = () => {
    if (commentText.trim() && onComment) {
      onComment(post.id, commentText.trim());
      setCommentText('');
      setShowCommentBox(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover:border-white/15 transition-all group/post">
      {/* Post Header */}
      <div className="p-4 pb-0 flex items-start gap-3">
        {/* Company Avatar */}
        <Link href={companyPath} className="flex-shrink-0">
          {post.companyLogo && !imgError ? (
            <div className="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-white/10">
              <Image
                src={post.companyLogo}
                alt={post.companyName}
                width={44}
                height={44}
                className="object-cover w-full h-full"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {post.companyName?.charAt(0)?.toUpperCase() || 'B'}
              </span>
            </div>
          )}
        </Link>

        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Link href={companyPath} className="text-sm font-bold text-white hover:text-violet-300 transition-colors truncate">
              {post.companyName}
            </Link>
            {post.isVerified && <BadgeCheck size={14} className="text-blue-400 flex-shrink-0" />}
            {post.isPremium && <Crown size={13} className="text-amber-400 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-500">{timeAgo(post.createdAt)}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${typeConfig.bg} ${typeConfig.color} flex items-center gap-0.5`}>
              <TypeIcon size={9} />
              {typeConfig.label}
            </span>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all opacity-0 group-hover/post:opacity-100"
          >
            <MoreHorizontal size={16} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 w-36 glass-card rounded-xl border border-white/10 shadow-2xl z-20 py-1 animate-fade-in">
              <button
                onClick={() => { onShare?.(post.id); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2"
              >
                <Share2 size={12} /> Share Post
              </button>
              <button
                onClick={() => { onSave?.(post.id); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-2"
              >
                <Bookmark size={12} /> {isSaved ? 'Unsave' : 'Save'} Post
              </button>
              {isOwner && (
                <button
                  onClick={() => { onDelete?.(post.id); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <Trash2 size={12} /> Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 py-3">
        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Media */}
      {post.mediaUrl && post.mediaType === 'image' && (
        <div className="relative aspect-video bg-black/20">
          <Image
            src={post.mediaUrl}
            alt="Post media"
            fill
            className="object-cover"
          />
        </div>
      )}
      {post.mediaUrl && post.mediaType === 'video' && (
        <div className="relative aspect-video bg-black">
          <video src={post.mediaUrl} controls className="w-full h-full object-contain" />
        </div>
      )}

      {/* Engagement Stats */}
      {(post.likesCount > 0 || post.commentsCount > 0) && (
        <div className="px-4 py-2 flex items-center justify-between text-[10px] text-gray-500">
          {post.likesCount > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-rose-500/20 flex items-center justify-center">
                <Heart size={8} className="text-rose-400 fill-rose-400" />
              </span>
              {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
            </span>
          )}
          {post.commentsCount > 0 && (
            <span>{post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}</span>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="px-3 py-2 border-t border-white/[0.04] flex items-center gap-1">
        <button
          onClick={() => onLike?.(post.id)}
          disabled={likeLoading}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            isLiked
              ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/15'
              : 'text-gray-400 hover:text-rose-400 hover:bg-white/[0.04]'
          }`}
        >
          {likeLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Heart size={14} className={isLiked ? 'fill-rose-400' : ''} />
          )}
          Like
        </button>
        <button
          onClick={() => setShowCommentBox(!showCommentBox)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-blue-400 hover:bg-white/[0.04] transition-all"
        >
          <MessageCircle size={14} />
          Comment
        </button>
        <button
          onClick={() => onShare?.(post.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-emerald-400 hover:bg-white/[0.04] transition-all"
        >
          <Share2 size={14} />
          Share
        </button>
        <button
          onClick={() => onSave?.(post.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
            isSaved
              ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/15'
              : 'text-gray-400 hover:text-amber-400 hover:bg-white/[0.04]'
          }`}
        >
          <Bookmark size={14} className={isSaved ? 'fill-amber-400' : ''} />
          Save
        </button>
      </div>

      {/* Comment Input */}
      {showCommentBox && (
        <div className="px-4 pb-3 border-t border-white/[0.04] pt-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/40"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitComment(); }}
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim()}
              className="p-2 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

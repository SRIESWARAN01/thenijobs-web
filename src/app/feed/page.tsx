'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { SocialPost, type SocialPostData } from '@/components/portal/SocialPost';
import {
  TrendingUp, Filter, Loader2, Megaphone, Briefcase,
  CalendarDays, MessageCircle, Globe
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '@/hooks/useAuth';

const FILTER_TYPES = [
  { value: 'all', label: 'All', icon: Globe },
  { value: 'offer', label: 'Offers', icon: Megaphone },
  { value: 'hiring', label: 'Hiring', icon: Briefcase },
  { value: 'event', label: 'Events', icon: CalendarDays },
  { value: 'general', label: 'Updates', icon: MessageCircle },
];

export default function PublicFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [likeLoadingId, setLikeLoadingId] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const PAGE_SIZE = 12;

  const loadPosts = async (isFirstPage = false) => {
    try {
      if (isFirstPage) {
        setLoading(true);
        setLastDoc(null);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const constraints: any[] = [
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE),
      ];

      if (filter !== 'all') {
        constraints.unshift(where('postType', '==', filter));
      }

      if (!isFirstPage && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(collection(db, 'socialPosts'), ...constraints);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        if (isFirstPage) setPosts([]);
        setHasMore(false);
        return;
      }

      const newPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SocialPostData[];

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

      if (isFirstPage) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      if (snapshot.size < PAGE_SIZE) setHasMore(false);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPosts(true);
  }, [filter]);

  // Load user's liked posts
  useEffect(() => {
    if (!user?.uid) return;
    const loadLikes = async () => {
      const q = query(collection(db, 'socialLikes'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const liked = new Set<string>();
      snapshot.docs.forEach((doc) => liked.add(doc.data().postId));
      setLikedPosts(liked);
    };
    loadLikes();
  }, [user?.uid]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    setLikeLoadingId(postId);
    try {
      const toggleLike = httpsCallable(functions, 'toggleSocialLike');
      const result = await toggleLike({ postId });
      const { liked } = result.data as { liked: boolean };

      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (liked) next.add(postId); else next.delete(postId);
        return next;
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likesCount: p.likesCount + (liked ? 1 : -1) }
            : p
        )
      );
    } catch (err) {
      console.error('Like failed:', err);
    } finally {
      setLikeLoadingId(null);
    }
  };

  const handleShare = (postId: string) => {
    const url = `${window.location.origin}/feed?post=${postId}`;
    navigator.clipboard.writeText(url);
    alert('Post link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] font-outfit">
      <Header />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp size={22} className="text-violet-400" />
              Business Feed
            </h1>
            <p className="text-sm text-gray-400 mt-1">Latest updates from businesses in your area</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
          {FILTER_TYPES.map((f) => {
            const Icon = f.icon;
            const isActive = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon size={12} />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
            <p className="text-sm text-gray-400">Loading feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <MessageCircle size={40} className="text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white">No Posts Yet</h3>
            <p className="text-sm text-gray-400 mt-2">Check back later for updates from businesses.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <SocialPost
                key={post.id}
                post={post}
                isLiked={likedPosts.has(post.id)}
                currentUserId={user?.uid}
                onLike={handleLike}
                onShare={handleShare}
                likeLoading={likeLoadingId === post.id}
              />
            ))}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={() => loadPosts(false)}
                disabled={loadingMore}
                className="w-full py-3 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all flex items-center justify-center gap-2"
              >
                {loadingMore ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useUploadFile } from '@/hooks/useStorage';
import { where, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import {
  PenLine, ImagePlus, Video, Megaphone, Briefcase,
  CalendarDays, MessageCircle, Loader2, Send, X, Building2
} from 'lucide-react';
import Link from 'next/link';
import { SocialPost, type SocialPostData } from '@/components/portal/SocialPost';

const POST_TYPES = [
  { value: 'general', label: 'Update', icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { value: 'offer', label: 'Offer / Deal', icon: Megaphone, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { value: 'hiring', label: 'Hiring Alert', icon: Briefcase, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { value: 'event', label: 'Event', icon: CalendarDays, color: 'text-violet-400', bg: 'bg-violet-500/10' },
];

export default function BusinessFeedPage() {
  const { user } = useAuth();
  const { uploadFile, progress: uploadProgress, loading: uploadLoading } = useUploadFile();

  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [likeLoadingId, setLikeLoadingId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];

  // Fetch own posts
  const { data: posts, loading: postsLoading } = useCollection<SocialPostData>('socialPosts', [
    where('companyId', '==', company?.id || ''),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  ], { skip: !company?.id });

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const removeMedia = () => {
    setMediaFile(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePost = async () => {
    if (!content.trim() || !company) return;
    setPosting(true);
    setError('');

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        const path = `social/${company.id}/${Date.now()}_${mediaFile.name}`;
        mediaUrl = await uploadFile(mediaFile, path);
        mediaType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
      }

      const createPost = httpsCallable(functions, 'createSocialPost');
      await createPost({
        content: content.trim(),
        mediaUrl,
        mediaType,
        postType,
        companyId: company.id,
        companyName: company.name,
        companyLogo: company.logoUrl || '',
      });

      setContent('');
      removeMedia();
      setPostType('general');
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    setLikeLoadingId(postId);
    try {
      const toggleLike = httpsCallable(functions, 'toggleSocialLike');
      await toggleLike({ postId });
    } catch (err) {
      console.error('Like failed:', err);
    } finally {
      setLikeLoadingId(null);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      const deletePost = httpsCallable(functions, 'deleteSocialPost');
      await deletePost({ postId });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-white">
        <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <Building2 size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Setup your company profile first to start posting updates.</p>
        <Link href="/business/company-profile" className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition-opacity">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white max-w-2xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Social Feed</h1>
        <p className="text-sm text-gray-400 mt-1">Share updates, offers, and hiring alerts with your audience</p>
      </div>

      {/* Create Post */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <PenLine size={18} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening at your business? Share an update, offer, or hiring alert..."
              maxLength={2000}
              className="w-full bg-transparent border-none text-sm text-white placeholder:text-gray-600 focus:outline-none resize-none"
            />
            <p className="text-[10px] text-gray-600 text-right">{content.length}/2000</p>
          </div>
        </div>

        {/* Media Preview */}
        {mediaPreview && (
          <div className="relative rounded-xl overflow-hidden bg-black/20">
            {mediaFile?.type.startsWith('video/') ? (
              <video src={mediaPreview} className="w-full max-h-60 object-contain" controls />
            ) : (
              <img src={mediaPreview} alt="Preview" className="w-full max-h-60 object-contain" />
            )}
            <button
              onClick={removeMedia}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X size={14} />
            </button>
            {uploadLoading && (
              <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center p-4">
                <Loader2 size={24} className="text-violet-400 animate-spin mb-2" />
                <p className="text-xs text-white font-semibold">
                  {uploadProgress <= 10 ? 'Preparing Media...' : uploadProgress < 90 ? 'Uploading to Cloud...' : 'Finishing Upload...'}
                </p>
                <div className="w-full max-w-[200px] bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-450 mt-1">{uploadProgress}%</span>
              </div>
            )}
          </div>
        )}

        {/* Post Type Selector */}
        <div className="flex gap-2 flex-wrap">
          {POST_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = postType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setPostType(type.value)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                  isActive
                    ? `${type.bg} ${type.color} border border-current/20`
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={10} />
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="p-2 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
              title="Add Image"
            >
              <ImagePlus size={18} />
            </button>
            <button
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.accept = 'video/*';
                  fileRef.current.click();
                  fileRef.current.accept = 'image/*,video/*';
                }
              }}
              className="p-2 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
              title="Add Video"
            >
              <Video size={18} />
            </button>
          </div>

          <button
            onClick={handlePost}
            disabled={posting || !content.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-xs hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
          >
            {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/15">
            <p className="text-[11px] text-rose-400">{error}</p>
          </div>
        )}
      </div>

      {/* Posts */}
      {postsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="text-violet-400 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <MessageCircle size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No posts yet. Share your first update!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <SocialPost
              key={post.id}
              post={post}
              currentUserId={user?.uid}
              onLike={handleLike}
              onDelete={handleDelete}
              likeLoading={likeLoadingId === post.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

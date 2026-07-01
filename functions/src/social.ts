import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, REGION } from './config';
import { FieldValue } from 'firebase-admin/firestore';

// ============================================================
// Social Feed Cloud Functions
// ============================================================

const COMMON_OPTS = { region: REGION, maxInstances: 10 } as const;

// ─── Create Social Post ─────────────────────────────────────
export const createSocialPost = onCall(COMMON_OPTS, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');

  const { content, mediaUrl, mediaType, postType, companyId, companyName, companyLogo } = request.data;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Post content is required');
  }

  if (content.length > 2000) {
    throw new HttpsError('invalid-argument', 'Post content exceeds 2000 character limit');
  }

  if (!companyId) {
    throw new HttpsError('invalid-argument', 'Company ID is required');
  }

  // Verify ownership
  const companyDoc = await db.collection('companies').doc(companyId).get();
  if (!companyDoc.exists || companyDoc.data()?.ownerId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'You do not own this company');
  }

  // Simple spam detection
  const recentPosts = await db.collection('socialPosts')
    .where('authorId', '==', request.auth.uid)
    .where('createdAt', '>=', new Date(Date.now() - 5 * 60 * 1000)) // last 5 minutes
    .get();

  if (recentPosts.size >= 3) {
    throw new HttpsError('resource-exhausted', 'Too many posts in a short period. Please wait a few minutes.');
  }

  const postData = {
    authorId: request.auth.uid,
    companyId,
    companyName: companyName || '',
    companyLogo: companyLogo || '',
    content: content.trim(),
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null, // 'image' | 'video' | null
    postType: postType || 'general', // 'general' | 'offer' | 'hiring' | 'event'
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    isActive: true,
    isPinned: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('socialPosts').add(postData);

  return { success: true, postId: docRef.id };
});

// ─── Toggle Like ─────────────────────────────────────────────
export const toggleSocialLike = onCall(COMMON_OPTS, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');

  const { postId } = request.data;
  if (!postId) throw new HttpsError('invalid-argument', 'Post ID is required');

  const likeId = `${postId}_${request.auth.uid}`;
  const likeRef = db.collection('socialLikes').doc(likeId);
  const postRef = db.collection('socialPosts').doc(postId);

  const likeDoc = await likeRef.get();

  if (likeDoc.exists) {
    // Unlike
    await db.runTransaction(async (tx) => {
      tx.delete(likeRef);
      tx.update(postRef, { likesCount: FieldValue.increment(-1) });
    });
    return { liked: false };
  } else {
    // Like
    await db.runTransaction(async (tx) => {
      tx.set(likeRef, {
        postId,
        userId: request.auth!.uid,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.update(postRef, { likesCount: FieldValue.increment(1) });
    });
    return { liked: true };
  }
});

// ─── Add Comment ─────────────────────────────────────────────
export const addSocialComment = onCall(COMMON_OPTS, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');

  const { postId, text, userName, userPhoto } = request.data;

  if (!postId) throw new HttpsError('invalid-argument', 'Post ID is required');
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Comment text is required');
  }
  if (text.length > 500) {
    throw new HttpsError('invalid-argument', 'Comment exceeds 500 character limit');
  }

  const postRef = db.collection('socialPosts').doc(postId);
  const postDoc = await postRef.get();
  if (!postDoc.exists) throw new HttpsError('not-found', 'Post not found');

  const commentData = {
    postId,
    userId: request.auth.uid,
    userName: userName || 'Anonymous',
    userPhoto: userPhoto || null,
    text: text.trim(),
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
  };

  const commentRef = await db.collection('socialComments').add(commentData);

  // Increment comment count
  await postRef.update({ commentsCount: FieldValue.increment(1) });

  return { success: true, commentId: commentRef.id };
});

// ─── Delete Social Post ──────────────────────────────────────
export const deleteSocialPost = onCall(COMMON_OPTS, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');

  const { postId } = request.data;
  if (!postId) throw new HttpsError('invalid-argument', 'Post ID is required');

  const postRef = db.collection('socialPosts').doc(postId);
  const postDoc = await postRef.get();

  if (!postDoc.exists) throw new HttpsError('not-found', 'Post not found');
  if (postDoc.data()?.authorId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'You can only delete your own posts');
  }

  // Soft delete
  await postRef.update({
    isActive: false,
    deletedAt: FieldValue.serverTimestamp(),
  });

  return { success: true };
});

// ─── Submit Review (Supports Guest & Authenticated) ──────────
export const submitBusinessReview = onCall(COMMON_OPTS, async (request) => {
  const { companyId, rating, comment, userName, userPhoto, guestName, guestPhone, guestEmail } = request.data;

  if (!companyId) throw new HttpsError('invalid-argument', 'Company ID is required');
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    throw new HttpsError('invalid-argument', 'Rating must be between 1 and 5');
  }

  const isAuthenticated = !!request.auth?.uid;
  const isGuest = !isAuthenticated;

  // Guest validation: require name and phone
  if (isGuest) {
    if (!guestName || typeof guestName !== 'string' || guestName.trim().length < 2) {
      throw new HttpsError('invalid-argument', 'Name is required for guest reviews (min 2 characters).');
    }
    if (!guestPhone || typeof guestPhone !== 'string' || !/^\d{10}$/.test(guestPhone.replace(/\D/g, '').slice(-10))) {
      throw new HttpsError('invalid-argument', 'A valid 10-digit phone number is required for guest reviews.');
    }
  }

  // Check company exists
  const companyDoc = await db.collection('companies').doc(companyId).get();
  if (!companyDoc.exists) throw new HttpsError('not-found', 'Company not found');

  // Prevent reviewing own company (authenticated only)
  if (isAuthenticated && companyDoc.data()?.ownerId === request.auth!.uid) {
    throw new HttpsError('permission-denied', 'You cannot review your own company');
  }

  const cleanComment = comment?.trim() || '';
  if (cleanComment) {
    if (/(.)\\1{4,}/.test(cleanComment)) {
      throw new HttpsError('invalid-argument', 'Review comment contains spam or repetitive characters.');
    }
    if (/https?:\/\/[^\s]+/.test(cleanComment) || /www\.[^\s]+/.test(cleanComment)) {
      throw new HttpsError('invalid-argument', 'Links/URLs are not allowed in reviews.');
    }
    if (cleanComment.length < 5) {
      throw new HttpsError('invalid-argument', 'Review comment is too short (min 5 characters).');
    }
  }

  // Guest rate limiting: max 3 reviews per phone per company per 24h
  if (isGuest) {
    const cleanPhone = guestPhone.replace(/\D/g, '').slice(-10);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentGuest = await db.collection('reviews')
      .where('companyId', '==', companyId)
      .where('guestPhone', '==', cleanPhone)
      .where('createdAt', '>=', oneDayAgo)
      .get();
    if (recentGuest.size >= 3) {
      throw new HttpsError('resource-exhausted', 'Too many reviews from this phone number. Please try again later.');
    }
  }

  // Check for existing review (authenticated: one per user per company)
  if (isAuthenticated) {
    const existingReview = await db.collection('reviews')
      .where('companyId', '==', companyId)
      .where('userId', '==', request.auth!.uid)
      .limit(1)
      .get();

    if (!existingReview.empty) {
      const existingDoc = existingReview.docs[0];
      await existingDoc.ref.update({
        rating,
        comment: cleanComment,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update company aggregate rating
      const allReviews = await db.collection('reviews')
        .where('companyId', '==', companyId)
        .where('status', '==', 'approved')
        .get();

      let totalRating = 0;
      allReviews.forEach((d) => {
        totalRating += d.data().rating || 0;
      });
      const avgRating = totalRating / allReviews.size;

      await db.collection('companies').doc(companyId).update({
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: allReviews.size,
      });

      return { success: true, reviewId: existingDoc.id, updated: true };
    }
  }

  const reviewData: Record<string, any> = {
    companyId,
    rating,
    comment: cleanComment,
    // Guest reviews require admin moderation; authenticated reviews publish instantly
    status: isAuthenticated ? 'approved' : 'pending',
    replyText: null,
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
  };

  if (isAuthenticated) {
    reviewData.userId = request.auth!.uid;
    reviewData.userName = userName || 'Anonymous';
    reviewData.userPhoto = userPhoto || null;
    reviewData.isGuest = false;
  } else {
    reviewData.userId = null;
    reviewData.userName = guestName.trim();
    reviewData.guestPhone = guestPhone.replace(/\D/g, '').slice(-10);
    reviewData.guestEmail = guestEmail?.trim() || null;
    reviewData.userPhoto = null;
    reviewData.isGuest = true;
  }

  const reviewRef = await db.collection('reviews').add(reviewData);

  // Update company aggregate rating (only if approved)
  if (isAuthenticated) {
    const allReviews = await db.collection('reviews')
      .where('companyId', '==', companyId)
      .where('status', '==', 'approved')
      .get();

    let totalRating = 0;
    allReviews.forEach((d) => {
      totalRating += d.data().rating || 0;
    });
    const avgRating = totalRating / allReviews.size;

    await db.collection('companies').doc(companyId).update({
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: allReviews.size,
    });
  }

  return { success: true, reviewId: reviewRef.id, pending: isGuest };
});

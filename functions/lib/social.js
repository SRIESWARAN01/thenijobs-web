"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitBusinessReview = exports.deleteSocialPost = exports.addSocialComment = exports.toggleSocialLike = exports.createSocialPost = void 0;
const https_1 = require("firebase-functions/v2/https");
const config_1 = require("./config");
const firestore_1 = require("firebase-admin/firestore");
// ============================================================
// Social Feed Cloud Functions
// ============================================================
const COMMON_OPTS = { region: config_1.REGION, maxInstances: 10 };
// ─── Create Social Post ─────────────────────────────────────
exports.createSocialPost = (0, https_1.onCall)(COMMON_OPTS, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { content, mediaUrl, mediaType, postType, companyId, companyName, companyLogo } = request.data;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'Post content is required');
    }
    if (content.length > 2000) {
        throw new https_1.HttpsError('invalid-argument', 'Post content exceeds 2000 character limit');
    }
    if (!companyId) {
        throw new https_1.HttpsError('invalid-argument', 'Company ID is required');
    }
    // Verify ownership
    const companyDoc = await config_1.db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists || companyDoc.data()?.ownerId !== request.auth.uid) {
        throw new https_1.HttpsError('permission-denied', 'You do not own this company');
    }
    // Simple spam detection
    const recentPosts = await config_1.db.collection('socialPosts')
        .where('authorId', '==', request.auth.uid)
        .where('createdAt', '>=', new Date(Date.now() - 5 * 60 * 1000)) // last 5 minutes
        .get();
    if (recentPosts.size >= 3) {
        throw new https_1.HttpsError('resource-exhausted', 'Too many posts in a short period. Please wait a few minutes.');
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
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    };
    const docRef = await config_1.db.collection('socialPosts').add(postData);
    return { success: true, postId: docRef.id };
});
// ─── Toggle Like ─────────────────────────────────────────────
exports.toggleSocialLike = (0, https_1.onCall)(COMMON_OPTS, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { postId } = request.data;
    if (!postId)
        throw new https_1.HttpsError('invalid-argument', 'Post ID is required');
    const likeId = `${postId}_${request.auth.uid}`;
    const likeRef = config_1.db.collection('socialLikes').doc(likeId);
    const postRef = config_1.db.collection('socialPosts').doc(postId);
    const likeDoc = await likeRef.get();
    if (likeDoc.exists) {
        // Unlike
        await config_1.db.runTransaction(async (tx) => {
            tx.delete(likeRef);
            tx.update(postRef, { likesCount: firestore_1.FieldValue.increment(-1) });
        });
        return { liked: false };
    }
    else {
        // Like
        await config_1.db.runTransaction(async (tx) => {
            tx.set(likeRef, {
                postId,
                userId: request.auth.uid,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            });
            tx.update(postRef, { likesCount: firestore_1.FieldValue.increment(1) });
        });
        return { liked: true };
    }
});
// ─── Add Comment ─────────────────────────────────────────────
exports.addSocialComment = (0, https_1.onCall)(COMMON_OPTS, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { postId, text, userName, userPhoto } = request.data;
    if (!postId)
        throw new https_1.HttpsError('invalid-argument', 'Post ID is required');
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'Comment text is required');
    }
    if (text.length > 500) {
        throw new https_1.HttpsError('invalid-argument', 'Comment exceeds 500 character limit');
    }
    const postRef = config_1.db.collection('socialPosts').doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists)
        throw new https_1.HttpsError('not-found', 'Post not found');
    const commentData = {
        postId,
        userId: request.auth.uid,
        userName: userName || 'Anonymous',
        userPhoto: userPhoto || null,
        text: text.trim(),
        isActive: true,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    };
    const commentRef = await config_1.db.collection('socialComments').add(commentData);
    // Increment comment count
    await postRef.update({ commentsCount: firestore_1.FieldValue.increment(1) });
    return { success: true, commentId: commentRef.id };
});
// ─── Delete Social Post ──────────────────────────────────────
exports.deleteSocialPost = (0, https_1.onCall)(COMMON_OPTS, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { postId } = request.data;
    if (!postId)
        throw new https_1.HttpsError('invalid-argument', 'Post ID is required');
    const postRef = config_1.db.collection('socialPosts').doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists)
        throw new https_1.HttpsError('not-found', 'Post not found');
    if (postDoc.data()?.authorId !== request.auth.uid) {
        throw new https_1.HttpsError('permission-denied', 'You can only delete your own posts');
    }
    // Soft delete
    await postRef.update({
        isActive: false,
        deletedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    return { success: true };
});
// ─── Submit Review ───────────────────────────────────────────
exports.submitBusinessReview = (0, https_1.onCall)(COMMON_OPTS, async (request) => {
    if (!request.auth)
        throw new https_1.HttpsError('unauthenticated', 'Login required');
    const { companyId, rating, comment, userName, userPhoto } = request.data;
    if (!companyId)
        throw new https_1.HttpsError('invalid-argument', 'Company ID is required');
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw new https_1.HttpsError('invalid-argument', 'Rating must be between 1 and 5');
    }
    // Check company exists
    const companyDoc = await config_1.db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists)
        throw new https_1.HttpsError('not-found', 'Company not found');
    // Prevent reviewing own company
    if (companyDoc.data()?.ownerId === request.auth.uid) {
        throw new https_1.HttpsError('permission-denied', 'You cannot review your own company');
    }
    const cleanComment = comment?.trim() || '';
    if (cleanComment) {
        // Check for repetitive characters (e.g., "aaaaaaa")
        if (/(.)\1{4,}/.test(cleanComment)) {
            throw new https_1.HttpsError('invalid-argument', 'Review comment contains spam or repetitive characters.');
        }
        // Check for spam URLs/links
        if (/https?:\/\/[^\s]+/.test(cleanComment) || /www\.[^\s]+/.test(cleanComment)) {
            throw new https_1.HttpsError('invalid-argument', 'Links/URLs are not allowed in reviews.');
        }
        // Check minimum length if comment is provided
        if (cleanComment.length < 5) {
            throw new https_1.HttpsError('invalid-argument', 'Review comment is too short (min 5 characters).');
        }
    }
    // Check for existing review (one per user per company)
    const existingReview = await config_1.db.collection('reviews')
        .where('companyId', '==', companyId)
        .where('userId', '==', request.auth.uid)
        .limit(1)
        .get();
    if (!existingReview.empty) {
        const existingDoc = existingReview.docs[0];
        await existingDoc.ref.update({
            rating,
            comment: cleanComment,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        // Update company aggregate rating
        const allReviews = await config_1.db.collection('reviews')
            .where('companyId', '==', companyId)
            .where('status', '==', 'approved')
            .get();
        let totalRating = 0;
        allReviews.forEach((d) => {
            totalRating += d.data().rating || 0;
        });
        const avgRating = totalRating / allReviews.size;
        await config_1.db.collection('companies').doc(companyId).update({
            averageRating: Math.round(avgRating * 10) / 10,
            totalReviews: allReviews.size,
        });
        return { success: true, reviewId: existingDoc.id, updated: true };
    }
    const reviewData = {
        companyId,
        userId: request.auth.uid,
        userName: userName || 'Anonymous',
        userPhoto: userPhoto || null,
        rating,
        comment: cleanComment,
        status: 'approved', // instant publish
        replyText: null,
        isActive: true,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    };
    const reviewRef = await config_1.db.collection('reviews').add(reviewData);
    // Update company aggregate rating
    const allReviews = await config_1.db.collection('reviews')
        .where('companyId', '==', companyId)
        .where('status', '==', 'approved')
        .get();
    let totalRating = 0;
    allReviews.forEach((d) => {
        totalRating += d.data().rating || 0;
    });
    const avgRating = totalRating / allReviews.size;
    await config_1.db.collection('companies').doc(companyId).update({
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: allReviews.size,
    });
    return { success: true, reviewId: reviewRef.id };
});
//# sourceMappingURL=social.js.map
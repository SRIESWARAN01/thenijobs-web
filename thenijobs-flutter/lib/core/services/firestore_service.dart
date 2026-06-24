import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:flutter_riverpod/flutter_riverpod.dart';

typedef FirestoreDocument = Map<String, dynamic>;

const String _functionsRegion = 'asia-south1';

enum FirestoreOperator {
  equal,
  notEqual,
  lessThan,
  lessThanOrEqual,
  greaterThan,
  greaterThanOrEqual,
  arrayContains,
  arrayContainsAny,
  whereIn,
  notIn,
}

class FirestoreWhere {
  const FirestoreWhere(
    this.field,
    this.value, {
    this.operator = FirestoreOperator.equal,
  });

  final String field;
  final Object? value;
  final FirestoreOperator operator;

  List<Object?> _listValue() {
    final raw = value;
    if (raw is Iterable) return raw.toList();
    return const <Object?>[];
  }

  Query<FirestoreDocument> apply(Query<FirestoreDocument> query) {
    final Object queryField = field == '__name__'
        ? FieldPath.documentId
        : field;
    switch (operator) {
      case FirestoreOperator.equal:
        return query.where(queryField, isEqualTo: value);
      case FirestoreOperator.notEqual:
        return query.where(queryField, isNotEqualTo: value);
      case FirestoreOperator.lessThan:
        return query.where(queryField, isLessThan: value);
      case FirestoreOperator.lessThanOrEqual:
        return query.where(queryField, isLessThanOrEqualTo: value);
      case FirestoreOperator.greaterThan:
        return query.where(queryField, isGreaterThan: value);
      case FirestoreOperator.greaterThanOrEqual:
        return query.where(queryField, isGreaterThanOrEqualTo: value);
      case FirestoreOperator.arrayContains:
        return query.where(queryField, arrayContains: value);
      case FirestoreOperator.arrayContainsAny:
        return query.where(queryField, arrayContainsAny: _listValue());
      case FirestoreOperator.whereIn:
        return query.where(queryField, whereIn: _listValue());
      case FirestoreOperator.notIn:
        return query.where(queryField, whereNotIn: _listValue());
    }
  }
}

class FirestoreOrder {
  const FirestoreOrder(this.field, {this.descending = false});

  final String field;
  final bool descending;
}

class PlatformStats {
  const PlatformStats({
    required this.totalUsers,
    required this.totalBusinesses,
    required this.activeJobs,
    required this.totalApplications,
    required this.totalLeads,
    required this.totalRevenue,
  });

  final int totalUsers;
  final int totalBusinesses;
  final int activeJobs;
  final int totalApplications;
  final int totalLeads;
  final num totalRevenue;
}

class EmployerStats {
  const EmployerStats({
    required this.activeJobs,
    required this.totalApplications,
    required this.shortlisted,
    required this.interviews,
    required this.hired,
    required this.profileViews,
  });

  final int activeJobs;
  final int totalApplications;
  final int shortlisted;
  final int interviews;
  final int hired;
  final int profileViews;
}

class SeekerStats {
  const SeekerStats({
    required this.appliedJobs,
    required this.savedJobs,
    required this.interviews,
    required this.profileViews,
  });

  final int appliedJobs;
  final int savedJobs;
  final int interviews;
  final int profileViews;
}

class CompanyFilters {
  const CompanyFilters({
    this.status,
    this.category,
    this.district,
    this.isFeatured,
    this.search,
    this.limitCount,
  });

  final String? status;
  final String? category;
  final String? district;
  final bool? isFeatured;
  final String? search;
  final int? limitCount;
}

class JobFilters {
  const JobFilters({
    this.isActive,
    this.companyId,
    this.category,
    this.district,
    this.jobType,
    this.isFeatured,
    this.isUrgent,
    this.search,
    this.limitCount,
  });

  final bool? isActive;
  final String? companyId;
  final String? category;
  final String? district;
  final String? jobType;
  final bool? isFeatured;
  final bool? isUrgent;
  final String? search;
  final int? limitCount;
}

class ApplicationFilters {
  const ApplicationFilters({
    this.seekerId,
    this.companyId,
    this.jobId,
    this.status,
  });

  final String? seekerId;
  final String? companyId;
  final String? jobId;
  final String? status;
}

class LeadFilters {
  const LeadFilters({this.companyId, this.status});

  final String? companyId;
  final String? status;
}

class InterviewFilters {
  const InterviewFilters({this.seekerId, this.employerId, this.companyId});

  final String? seekerId;
  final String? employerId;
  final String? companyId;
}

class UserFilters {
  const UserFilters({this.role, this.isVerified, this.limitCount});

  final String? role;
  final bool? isVerified;
  final int? limitCount;
}

class ServiceFilters {
  const ServiceFilters({
    this.status,
    this.category,
    this.district,
    this.providerId,
    this.search,
  });

  final String? status;
  final String? category;
  final String? district;
  final String? providerId;
  final String? search;
}

class SubscriptionFilters {
  const SubscriptionFilters({this.userId, this.companyId, this.status});

  final String? userId;
  final String? companyId;
  final String? status;
}

class AdvertisementFilters {
  const AdvertisementFilters({this.status});

  final String? status;
}

class PaymentFilters {
  const PaymentFilters({this.userId, this.companyId, this.status});

  final String? userId;
  final String? companyId;
  final String? status;
}

class ApplyToJobData {
  const ApplyToJobData({
    required this.jobId,
    required this.companyId,
    required this.seekerId,
    required this.seekerName,
    this.jobTitle,
    this.companyName,
    this.seekerEmail,
    this.seekerPhone,
    this.resumeUrl,
    this.resumeName,
    this.coverLetter,
  });

  final String jobId;
  final String companyId;
  final String seekerId;
  final String seekerName;
  final String? jobTitle;
  final String? companyName;
  final String? seekerEmail;
  final String? seekerPhone;
  final String? resumeUrl;
  final String? resumeName;
  final String? coverLetter;

  FirestoreDocument toFirestore() {
    return {
      'jobId': jobId,
      'companyId': companyId,
      'seekerId': seekerId,
      'seekerName': seekerName,
      if (jobTitle != null) 'jobTitle': jobTitle,
      if (companyName != null) 'companyName': companyName,
      if (seekerEmail != null) 'seekerEmail': seekerEmail,
      if (seekerPhone != null) 'seekerPhone': seekerPhone,
      if (resumeUrl != null) 'resumeUrl': resumeUrl,
      if (resumeName != null) 'resumeName': resumeName,
      if (coverLetter != null) 'coverLetter': coverLetter,
    };
  }
}

class NotificationData {
  const NotificationData({
    required this.userId,
    required this.type,
    required this.title,
    required this.message,
    this.actionUrl,
  });

  final String userId;
  final String type;
  final String title;
  final String message;
  final String? actionUrl;

  FirestoreDocument toFirestore() {
    return {
      'userId': userId,
      'type': type,
      'title': title,
      'message': message,
      if (actionUrl != null) 'actionUrl': actionUrl,
    };
  }
}

class CompanyEnquiryData {
  const CompanyEnquiryData({
    required this.companyId,
    required this.companyName,
    required this.ownerId,
    required this.name,
    required this.phone,
    required this.message,
    this.email,
    this.userId,
    this.category,
    this.district,
  });

  final String companyId;
  final String companyName;
  final String ownerId;
  final String name;
  final String phone;
  final String message;
  final String? email;
  final String? userId;
  final String? category;
  final String? district;
}

class CompanyReviewData {
  const CompanyReviewData({
    required this.companyId,
    required this.companyName,
    required this.reviewerId,
    required this.reviewerName,
    required this.rating,
    required this.title,
    required this.content,
    this.reviewType = 'company',
  });

  final String companyId;
  final String companyName;
  final String reviewerId;
  final String reviewerName;
  final double rating;
  final String title;
  final String content;
  final String reviewType;
}

class CompanyProfileData {
  const CompanyProfileData({
    required this.ownerId,
    required this.baseSlug,
    required this.name,
    required this.category,
    required this.description,
    required this.phone,
    required this.email,
    required this.address,
    required this.district,
    required this.emailVerified,
    this.website,
    this.services = const [],
  });

  final String ownerId;
  final String baseSlug;
  final String name;
  final String category;
  final String description;
  final String phone;
  final String email;
  final String address;
  final String district;
  final bool emailVerified;
  final String? website;
  final List<String> services;
}

class ActivityLogData {
  const ActivityLogData({
    required this.userId,
    required this.userName,
    required this.action,
    required this.target,
    required this.targetId,
    this.details,
  });

  final String userId;
  final String userName;
  final String action;
  final String target;
  final String targetId;
  final String? details;

  FirestoreDocument toFirestore() {
    return {
      'userId': userId,
      'userName': userName,
      'action': action,
      'target': target,
      'targetId': targetId,
      if (details != null) 'details': details,
    };
  }
}

class ConversationData {
  const ConversationData({
    required this.participants,
    required this.participantNames,
    required this.participantRoles,
    this.participantPhotos,
    this.jobId,
    this.jobTitle,
    this.companyId,
  });

  final List<String> participants;
  final Map<String, String> participantNames;
  final Map<String, String> participantRoles;
  final Map<String, String>? participantPhotos;
  final String? jobId;
  final String? jobTitle;
  final String? companyId;
}

class ChatAttachmentData {
  const ChatAttachmentData({
    required this.type,
    required this.url,
    required this.name,
    this.size,
  });

  final String type;
  final String url;
  final String name;
  final int? size;

  FirestoreDocument toFirestore() {
    return {
      'type': type,
      'url': url,
      'name': name,
      if (size != null) 'size': size,
    };
  }
}

class ChatMessageData {
  const ChatMessageData({
    required this.senderId,
    required this.senderName,
    required this.senderRole,
    required this.text,
    this.type = 'text',
    this.attachments = const [],
  });

  final String senderId;
  final String senderName;
  final String senderRole;
  final String text;
  final String type;
  final List<ChatAttachmentData> attachments;
}

class BadgeData {
  const BadgeData({
    required this.id,
    required this.name,
    required this.icon,
    required this.description,
  });

  final String id;
  final String name;
  final String icon;
  final String description;
}

final firestoreServiceProvider = Provider<FirestoreService>((ref) {
  return FirestoreService();
});

class FirestoreService {
  FirestoreService({
    FirebaseFirestore? firestore,
    fb.FirebaseAuth? auth,
    FirebaseFunctions? functions,
  }) : _firestore = firestore ?? FirebaseFirestore.instance,
       _auth = auth ?? fb.FirebaseAuth.instance,
       _functions =
           functions ?? FirebaseFunctions.instanceFor(region: _functionsRegion);

  final FirebaseFirestore _firestore;
  final fb.FirebaseAuth _auth;
  final FirebaseFunctions _functions;

  CollectionReference<FirestoreDocument> _collection(String path) {
    return _firestore.collection(path);
  }

  DocumentReference<FirestoreDocument> _doc(String collectionPath, String id) {
    return _collection(collectionPath).doc(id);
  }

  Future<Map<Object?, Object?>> _callFunction(
    String name,
    Map<String, Object?> data,
  ) async {
    final callable = _functions.httpsCallable(name);
    final result = await callable.call<Map<Object?, Object?>>(data);
    return result.data;
  }

  FirestoreDocument _withId(DocumentSnapshot<FirestoreDocument> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    return {'id': doc.id, ...data};
  }

  Query<FirestoreDocument> _applyWhere(
    Query<FirestoreDocument> query,
    List<FirestoreWhere> filters,
  ) {
    var current = query;
    for (final filter in filters) {
      current = filter.apply(current);
    }
    return current;
  }

  Query<FirestoreDocument> _applyOrder(
    Query<FirestoreDocument> query,
    List<FirestoreOrder> orderBy,
  ) {
    var current = query;
    for (final order in orderBy) {
      current = current.orderBy(order.field, descending: order.descending);
    }
    return current;
  }

  List<FirestoreDocument> _filterSearch(
    List<FirestoreDocument> docs,
    String? search,
    List<String> fields,
  ) {
    final needle = search?.trim().toLowerCase();
    if (needle == null || needle.isEmpty) return docs;

    return docs.where((doc) {
      return fields.any((field) {
        final value = doc[field];
        return value != null && value.toString().toLowerCase().contains(needle);
      });
    }).toList();
  }

  Future<List<FirestoreDocument>> fetchCollection(
    String collectionPath, {
    List<FirestoreWhere> filters = const [],
    List<FirestoreOrder> orderBy = const [],
    int? limitCount,
  }) async {
    Query<FirestoreDocument> query = _collection(collectionPath);
    query = _applyWhere(query, filters);
    query = _applyOrder(query, orderBy);
    if (limitCount != null) query = query.limit(limitCount);

    final snapshot = await query.get();
    return snapshot.docs.map(_withId).toList();
  }

  Stream<List<FirestoreDocument>> streamCollection(
    String collectionPath, {
    List<FirestoreWhere> filters = const [],
    List<FirestoreOrder> orderBy = const [],
    int? limitCount,
  }) {
    Query<FirestoreDocument> query = _collection(collectionPath);
    query = _applyWhere(query, filters);
    query = _applyOrder(query, orderBy);
    if (limitCount != null) query = query.limit(limitCount);

    return query.snapshots().map((snapshot) {
      return snapshot.docs.map(_withId).toList();
    });
  }

  Future<FirestoreDocument?> fetchDocument(
    String collectionPath,
    String docId,
  ) async {
    final snapshot = await _doc(collectionPath, docId).get();
    if (!snapshot.exists) return null;
    return _withId(snapshot);
  }

  Stream<FirestoreDocument?> streamDocument(
    String collectionPath,
    String docId,
  ) {
    return _doc(collectionPath, docId).snapshots().map((snapshot) {
      if (!snapshot.exists) return null;
      return _withId(snapshot);
    });
  }

  Future<int> getCount(
    String collectionPath, {
    List<FirestoreWhere> filters = const [],
  }) async {
    Query<FirestoreDocument> query = _collection(collectionPath);
    query = _applyWhere(query, filters);
    final snapshot = await query.count().get();
    return snapshot.count ?? 0;
  }

  Future<PlatformStats> getPlatformStats() async {
    final results = await Future.wait<int>([
      getCount('users'),
      getCount(
        'companies',
        filters: const [FirestoreWhere('verificationStatus', 'verified')],
      ),
      getCount('jobs', filters: const [FirestoreWhere('isActive', true)]),
      getCount('applications'),
      getCount('leads'),
    ]);

    num totalRevenue = 0;
    try {
      final subscriptions = await fetchCollection(
        'subscriptions',
        filters: const [FirestoreWhere('status', 'active')],
      );
      totalRevenue = subscriptions.fold<num>(
        0,
        (runningTotal, sub) => runningTotal + ((sub['amount'] as num?) ?? 0),
      );
    } catch (_) {
      totalRevenue = 0;
    }

    return PlatformStats(
      totalUsers: results[0],
      totalBusinesses: results[1],
      activeJobs: results[2],
      totalApplications: results[3],
      totalLeads: results[4],
      totalRevenue: totalRevenue,
    );
  }

  Future<EmployerStats> getEmployerStats(String companyId) async {
    final results = await Future.wait<int>([
      getCount(
        'jobs',
        filters: [
          FirestoreWhere('companyId', companyId),
          const FirestoreWhere('isActive', true),
        ],
      ),
      getCount(
        'applications',
        filters: [FirestoreWhere('companyId', companyId)],
      ),
      getCount(
        'applications',
        filters: [
          FirestoreWhere('companyId', companyId),
          const FirestoreWhere('status', 'shortlisted'),
        ],
      ),
      getCount('interviews', filters: [FirestoreWhere('companyId', companyId)]),
      getCount(
        'applications',
        filters: [
          FirestoreWhere('companyId', companyId),
          const FirestoreWhere('status', 'selected'),
        ],
      ),
    ]);

    var profileViews = 0;
    try {
      final company = await fetchDocument('companies', companyId);
      profileViews = ((company?['viewCount'] as num?) ?? 0).toInt();
    } catch (_) {
      profileViews = 0;
    }

    return EmployerStats(
      activeJobs: results[0],
      totalApplications: results[1],
      shortlisted: results[2],
      interviews: results[3],
      hired: results[4],
      profileViews: profileViews,
    );
  }

  Future<SeekerStats> getSeekerStats(String seekerId) async {
    final results = await Future.wait<int>([
      getCount('applications', filters: [FirestoreWhere('seekerId', seekerId)]),
      getCount('savedJobs', filters: [FirestoreWhere('userId', seekerId)]),
      getCount('interviews', filters: [FirestoreWhere('seekerId', seekerId)]),
    ]);

    var profileViews = 0;
    try {
      final profile = await fetchDocument('seekerProfiles', seekerId);
      profileViews = ((profile?['viewCount'] as num?) ?? 0).toInt();
    } catch (_) {
      profileViews = 0;
    }

    return SeekerStats(
      appliedJobs: results[0],
      savedJobs: results[1],
      interviews: results[2],
      profileViews: profileViews,
    );
  }

  Future<List<FirestoreDocument>> getCompanies([
    CompanyFilters filters = const CompanyFilters(),
  ]) async {
    final where = <FirestoreWhere>[
      if (filters.status != null)
        FirestoreWhere('verificationStatus', filters.status),
      if (filters.category != null)
        FirestoreWhere('category', filters.category),
      if (filters.district != null)
        FirestoreWhere('district', filters.district),
      if (filters.isFeatured != null)
        FirestoreWhere('isFeatured', filters.isFeatured),
    ];

    final docs = await fetchCollection(
      'companies',
      filters: where,
      limitCount: filters.limitCount,
    );
    return _filterSearch(docs, filters.search, [
      'name',
      'description',
      'category',
      'district',
    ]);
  }

  Future<FirestoreDocument?> getCompanyBySlug(String slug) async {
    final bySlug = await fetchCollection(
      'companies',
      filters: [FirestoreWhere('slug', slug)],
      limitCount: 1,
    );
    if (bySlug.isNotEmpty) return bySlug.first;
    return fetchDocument('companies', slug);
  }

  Future<FirestoreDocument?> getCompanyByOwner(String ownerId) async {
    final companies = await fetchCollection(
      'companies',
      filters: [FirestoreWhere('ownerId', ownerId)],
      limitCount: 1,
    );
    if (companies.isEmpty) return null;
    return companies.first;
  }

  Future<FirestoreDocument?> getCompanyByIdentifier(String identifier) async {
    final byId = await fetchDocument('companies', identifier);
    if (byId != null) return byId;

    final bySlug = await fetchCollection(
      'companies',
      filters: [FirestoreWhere('slug', identifier)],
      limitCount: 1,
    );
    if (bySlug.isNotEmpty) return bySlug.first;

    final bySmartId = await fetchCollection(
      'companies',
      filters: [FirestoreWhere('theniJobsId', identifier)],
      limitCount: 1,
    );
    if (bySmartId.isNotEmpty) return bySmartId.first;

    return null;
  }

  Future<String> createCompanyProfile(CompanyProfileData data) async {
    final docRef = _collection('companies').doc();
    final slugSeed = data.baseSlug.trim().isEmpty
        ? 'company'
        : data.baseSlug.trim();

    await docRef.set({
      'slug': '$slugSeed-${docRef.id.substring(0, 6)}',
      'ownerId': data.ownerId,
      'name': data.name,
      'category': data.category,
      'description': data.description,
      'phone': data.phone,
      'email': data.email,
      if (data.website != null && data.website!.trim().isNotEmpty)
        'website': data.website!.trim(),
      'whatsapp': data.phone,
      'address': data.address,
      'district': data.district,
      'state': 'Tamil Nadu',
      'country': 'India',
      'galleryImages': <String>[],
      'galleryVideos': <String>[],
      'services': data.services,
      'status': 'pending',
      'verificationStatus': 'pending',
      'verificationBadges': {
        'mobileVerified': false,
        'emailVerified': data.emailVerified,
        'gstVerified': false,
        'businessVerified': false,
      },
      'isActive': false,
      'isVerified': false,
      'isFeatured': false,
      'isPremium': false,
      'viewCount': 0,
      'enquiryCount': 0,
      'rating': 0,
      'reviewCount': 0,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    try {
      await _doc('users', data.ownerId).set({
        'companyId': docRef.id,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } catch (_) {
      // Company creation remains the source of truth if profile writes are restricted.
    }

    return docRef.id;
  }

  Future<FirestoreDocument?> getUserByIdentifier(String identifier) async {
    final byId = await fetchDocument('users', identifier);
    if (byId != null) return byId;

    final bySmartId = await fetchCollection(
      'users',
      filters: [FirestoreWhere('theniJobsId', identifier)],
      limitCount: 1,
    );
    if (bySmartId.isNotEmpty) return bySmartId.first;

    return null;
  }

  Future<FirestoreDocument?> getSeekerProfile(String uid) {
    return fetchDocument('seekerProfiles', uid);
  }

  Future<void> saveSeekerProfile(
    String uid,
    FirestoreDocument data, {
    FirestoreDocument? userData,
  }) async {
    final existingUser =
        userData ?? await fetchDocument('users', uid) ?? <String, dynamic>{};
    final theniJobsId = _cleanString(data['theniJobsId']).isNotEmpty
        ? _cleanString(data['theniJobsId'])
        : _cleanString(existingUser['theniJobsId']).isNotEmpty
        ? _cleanString(existingUser['theniJobsId'])
        : _generateTheniJobsId(uid, 'job_seeker');
    final profileScore = _calculateSeekerProfileScore({
      ...data,
      'theniJobsId': theniJobsId,
    });

    final profileData = <String, dynamic>{
      ...data,
      'theniJobsId': theniJobsId,
      'profileScore': profileScore,
      'profileStrength': profileScore['total'],
      'updatedAt': FieldValue.serverTimestamp(),
    };

    await _doc('seekerProfiles', uid).set(profileData, SetOptions(merge: true));

    await _doc('users', uid).set({
      if (_cleanString(profileData['name']).isNotEmpty)
        'displayName': _cleanString(profileData['name']),
      if (_cleanString(profileData['email']).isNotEmpty)
        'email': _cleanString(profileData['email']),
      if (_cleanString(profileData['phone']).isNotEmpty)
        'phone': _cleanString(profileData['phone']),
      if (_cleanString(profileData['district']).isNotEmpty)
        'district': _cleanString(profileData['district']),
      'theniJobsId': theniJobsId,
      if (profileData['skills'] is List) 'skills': profileData['skills'],
      'profileScore': profileScore,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    await _doc('publicProfiles', uid).set(
      _buildPublicSeekerProfile(uid, profileData, existingUser),
      SetOptions(merge: true),
    );
  }

  Future<void> addSeekerResume(String uid, FirestoreDocument resume) async {
    final existingProfile = await fetchDocument('seekerProfiles', uid);
    final profile = <String, dynamic>{...?existingProfile};
    final existingResumes = (profile['resumes'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
    final shouldDefault =
        resume['isDefault'] == true || existingResumes.isEmpty;
    final nextResume = <String, dynamic>{...resume, 'isDefault': shouldDefault};
    final nextResumes = [
      for (final item in existingResumes)
        {...item, if (shouldDefault) 'isDefault': false},
      nextResume,
    ];

    await saveSeekerProfile(uid, {
      ...profile,
      'resumes': nextResumes,
      'resumeUrl': FieldValue.delete(),
      'resumeURL': FieldValue.delete(),
      'resumeTitle': FieldValue.delete(),
    });
  }

  String _cleanString(Object? value) {
    return value is String ? value.trim() : '';
  }

  String _generateTheniJobsId(String stableId, String type) {
    final prefix = switch (type) {
      'employer' => 'TJ-EMP',
      'business_owner' => 'TJ-BIZ',
      _ => 'TJ-SEEK',
    };
    return '$prefix-${_hashForId('$type:$stableId')}';
  }

  String _hashForId(String value) {
    var hash = 0x811c9dc5;
    for (final codeUnit in value.codeUnits) {
      hash ^= codeUnit;
      hash = (hash * 0x01000193) & 0xffffffff;
    }
    final text = hash.toRadixString(36).toUpperCase().padLeft(7, '0');
    return text.substring(0, 7);
  }

  bool _hasValue(Object? value) {
    if (value is Iterable) {
      return value
          .where((item) => item != null && item.toString().trim().isNotEmpty)
          .isNotEmpty;
    }
    if (value is String) return value.trim().isNotEmpty;
    return value != null && value != false;
  }

  int _ratioScore(int done, int total, int weight) {
    if (total <= 0) return 0;
    final clamped = done < 0
        ? 0
        : done > total
        ? total
        : done;
    return ((clamped / total) * weight).round();
  }

  FirestoreDocument _calculateSeekerProfileScore(FirestoreDocument profile) {
    final skills = (profile['skills'] as List<dynamic>? ?? const []);
    final education = (profile['education'] as List<dynamic>? ?? const []);
    final experience = (profile['experience'] as List<dynamic>? ?? const []);
    final certifications =
        (profile['certifications'] as List<dynamic>? ?? const []);
    final projects = (profile['projects'] as List<dynamic>? ?? const []);
    final portfolio =
        (profile['portfolio'] as List<dynamic>? ??
        profile['portfolioLinks'] as List<dynamic>? ??
        const []);
    final resumes = (profile['resumes'] as List<dynamic>? ?? const []);
    final socialLinks = profile['socialLinks'] is Map
        ? (profile['socialLinks'] as Map).values.toList()
        : const <dynamic>[];

    final contactFields = [
      profile['name'] ?? profile['displayName'],
      profile['email'],
      profile['phone'],
      profile['district'],
      profile['address'],
    ];

    final photo =
        _hasValue(
          profile['photoUrl'] ??
              profile['profilePhotoUrl'] ??
              profile['photoURL'],
        )
        ? 10
        : 0;
    final resume = resumes.isNotEmpty ? 15 : 0;
    final skillScore = _ratioScore(
      skills.length > 5 ? 5 : skills.length,
      5,
      15,
    );
    final educationScore = education.isNotEmpty ? 10 : 0;
    final experienceScore = experience.isNotEmpty ? 10 : 0;
    final contact = _ratioScore(
      contactFields.where(_hasValue).length,
      contactFields.length,
      15,
    );
    final certificates = certifications.isNotEmpty ? 8 : 0;
    final projectScore = projects.isNotEmpty ? 7 : 0;
    final portfolioScore = portfolio.where(_hasValue).isNotEmpty ? 7 : 0;
    final social = socialLinks.where(_hasValue).isNotEmpty ? 3 : 0;
    final total =
        photo +
        resume +
        skillScore +
        educationScore +
        experienceScore +
        contact +
        certificates +
        projectScore +
        portfolioScore +
        social;

    return {
      'photo': photo,
      'resume': resume,
      'skills': skillScore,
      'education': educationScore,
      'experience': experienceScore,
      'contact': contact,
      'certificates': certificates,
      'projects': projectScore,
      'portfolio': portfolioScore,
      'social': social,
      'total': total > 100 ? 100 : total,
    };
  }

  FirestoreDocument _buildPublicSeekerProfile(
    String uid,
    FirestoreDocument profile,
    FirestoreDocument user,
  ) {
    final theniJobsId = _cleanString(profile['theniJobsId']).isNotEmpty
        ? _cleanString(profile['theniJobsId'])
        : _cleanString(user['theniJobsId']).isNotEmpty
        ? _cleanString(user['theniJobsId'])
        : _generateTheniJobsId(uid, 'job_seeker');
    final photoUrl = _cleanString(profile['photoUrl']).isNotEmpty
        ? _cleanString(profile['photoUrl'])
        : _cleanString(profile['profilePhotoUrl']).isNotEmpty
        ? _cleanString(profile['profilePhotoUrl'])
        : _cleanString(user['photoURL']);
    final portfolio =
        (profile['portfolio'] as List<dynamic>? ??
                profile['portfolioLinks'] as List<dynamic>? ??
                const [])
            .where(_hasValue)
            .take(12)
            .toList();
    final resumes = (profile['resumes'] as List<dynamic>? ?? const [])
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .where((item) => _hasValue(item['url']))
        .take(5)
        .toList();

    return {
      'id': uid,
      'ownerId': uid,
      'type': 'job_seeker',
      'theniJobsId': theniJobsId,
      'name': _cleanString(profile['name']).isNotEmpty
          ? _cleanString(profile['name'])
          : _cleanString(user['displayName']),
      'displayName': _cleanString(profile['name']).isNotEmpty
          ? _cleanString(profile['name'])
          : _cleanString(user['displayName']),
      'currentRole': _cleanString(profile['currentRole']),
      'qualification': _cleanString(profile['currentRole']).isNotEmpty
          ? _cleanString(profile['currentRole'])
          : 'Job Seeker',
      'district': _cleanString(profile['district']).isNotEmpty
          ? _cleanString(profile['district'])
          : _cleanString(user['district']),
      'photoUrl': photoUrl,
      'profilePhotoUrl': photoUrl,
      'isOpenToWork': profile['isOpenToWork'] != false,
      'isVerified': user['isVerified'] == true || profile['isVerified'] == true,
      'skills': (profile['skills'] as List<dynamic>? ?? const [])
          .where(_hasValue)
          .take(20)
          .toList(),
      'languages': (profile['languages'] as List<dynamic>? ?? const [])
          .where(_hasValue)
          .take(10)
          .toList(),
      'education': (profile['education'] as List<dynamic>? ?? const [])
          .take(10)
          .toList(),
      'experience': (profile['experience'] as List<dynamic>? ?? const [])
          .take(10)
          .toList(),
      'certifications':
          (profile['certifications'] as List<dynamic>? ?? const [])
              .take(10)
              .toList(),
      'projects': (profile['projects'] as List<dynamic>? ?? const [])
          .take(10)
          .toList(),
      'portfolioLinks': portfolio,
      'portfolioUrl': 'https://thenijobs.com/p/$theniJobsId',
      'hasResume':
          resumes.isNotEmpty || _cleanString(profile['resumeUrl']).isNotEmpty,
      'socialLinks': profile['socialLinks'] is Map
          ? profile['socialLinks']
          : <String, dynamic>{},
      'profileStrength':
          profile['profileStrength'] ??
          (profile['profileScore'] is Map
              ? profile['profileScore']['total']
              : 0),
      'profileScore': profile['profileScore'],
      'aiSummary': _cleanString(profile['aiSummary']).isNotEmpty
          ? _cleanString(profile['aiSummary'])
          : _cleanString(user['aiSummary']),
      'smartIdTheme': profile['smartIdTheme'] is Map
          ? profile['smartIdTheme']
          : <String, dynamic>{},
      'updatedAt': FieldValue.serverTimestamp(),
    };
  }

  Future<List<FirestoreDocument>> getJobs([
    JobFilters filters = const JobFilters(),
  ]) async {
    final where = <FirestoreWhere>[
      if (filters.isActive != null)
        FirestoreWhere('isActive', filters.isActive),
      if (filters.companyId != null)
        FirestoreWhere('companyId', filters.companyId),
      if (filters.category != null)
        FirestoreWhere('category', filters.category),
      if (filters.district != null)
        FirestoreWhere('district', filters.district),
      if (filters.jobType != null) FirestoreWhere('jobType', filters.jobType),
      if (filters.isFeatured != null)
        FirestoreWhere('isFeatured', filters.isFeatured),
      if (filters.isUrgent != null)
        FirestoreWhere('isUrgent', filters.isUrgent),
    ];

    final docs = await fetchCollection(
      'jobs',
      filters: where,
      limitCount: filters.limitCount,
    );
    return _filterSearch(docs, filters.search, [
      'title',
      'companyName',
      'description',
      'location',
    ]);
  }

  Future<FirestoreDocument?> getJobById(String jobId) {
    return fetchDocument('jobs', jobId);
  }

  Future<List<FirestoreDocument>> getApplications([
    ApplicationFilters filters = const ApplicationFilters(),
  ]) {
    return fetchCollection(
      'applications',
      filters: [
        if (filters.seekerId != null)
          FirestoreWhere('seekerId', filters.seekerId),
        if (filters.companyId != null)
          FirestoreWhere('companyId', filters.companyId),
        if (filters.jobId != null) FirestoreWhere('jobId', filters.jobId),
        if (filters.status != null) FirestoreWhere('status', filters.status),
      ],
    );
  }

  Future<String> applyToJob(ApplyToJobData data) async {
    final result = await _callFunction('applyToJob', {
      'jobId': data.jobId,
      if (data.seekerEmail != null) 'seekerEmail': data.seekerEmail,
      if (data.seekerPhone != null) 'seekerPhone': data.seekerPhone,
      if (data.resumeUrl != null) 'resumeUrl': data.resumeUrl,
      if (data.resumeName != null) 'resumeName': data.resumeName,
      if (data.coverLetter != null) 'coverLetter': data.coverLetter,
    });
    return result['applicationId']?.toString() ??
        '${data.seekerId}_${data.jobId}';
  }

  Future<void> updateApplicationStatus(
    String applicationId,
    String status, {
    String? note,
  }) async {
    await _callFunction('updateApplicationStatus', {
      'applicationId': applicationId,
      'status': status,
      if (note != null && note.isNotEmpty) 'note': note,
    });
  }

  Future<void> updateInterviewStatus(String interviewId, String status) async {
    await _callFunction('updateInterviewStatus', {
      'interviewId': interviewId,
      'status': status,
    });
  }

  Future<String> scheduleInterview({
    required String applicationId,
    required String date,
    required String time,
    required String mode,
    String? location,
    String? meetingLink,
    String? notes,
  }) async {
    final result = await _callFunction('scheduleInterview', {
      'applicationId': applicationId,
      'date': date,
      'time': time,
      'mode': mode,
      if (location != null && location.trim().isNotEmpty)
        'location': location.trim(),
      if (meetingLink != null && meetingLink.trim().isNotEmpty)
        'meetingLink': meetingLink.trim(),
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
    });
    return result['interviewId']?.toString() ?? '';
  }

  Future<void> saveJob(
    String userId,
    String jobId, {
    FirestoreDocument? metadata,
  }) async {
    final existing = await fetchCollection(
      'savedJobs',
      filters: [
        FirestoreWhere('userId', userId),
        FirestoreWhere('jobId', jobId),
      ],
      limitCount: 1,
    );
    if (existing.isNotEmpty) return;

    final payload = <String, dynamic>{
      ...?metadata,
      'userId': userId,
      'jobId': jobId,
      'createdAt': FieldValue.serverTimestamp(),
    };
    payload['savedAt'] ??= FieldValue.serverTimestamp();

    await _collection('savedJobs').add({...payload});
  }

  Future<void> unsaveJob(String userId, String jobId) async {
    final saved = await fetchCollection(
      'savedJobs',
      filters: [
        FirestoreWhere('userId', userId),
        FirestoreWhere('jobId', jobId),
      ],
    );

    final batch = _firestore.batch();
    for (final item in saved) {
      batch.delete(_doc('savedJobs', item['id'] as String));
    }
    await batch.commit();
  }

  Future<List<FirestoreDocument>> getSavedJobs(String userId) {
    return fetchCollection(
      'savedJobs',
      filters: [FirestoreWhere('userId', userId)],
    );
  }

  Future<List<FirestoreDocument>> getJobAlerts(String userId) {
    return fetchCollection(
      'jobAlerts',
      filters: [FirestoreWhere('userId', userId)],
      orderBy: const [FirestoreOrder('createdAt', descending: true)],
    );
  }

  Future<String> createJobAlert(FirestoreDocument data) {
    return createDocument('jobAlerts', data);
  }

  Future<void> updateJobAlert(String alertId, FirestoreDocument data) {
    return updateDocument('jobAlerts', alertId, data);
  }

  Future<void> deleteJobAlert(String alertId) {
    return deleteDocument('jobAlerts', alertId);
  }

  Future<List<FirestoreDocument>> getLeads([
    LeadFilters filters = const LeadFilters(),
  ]) {
    return fetchCollection(
      'leads',
      filters: [
        if (filters.companyId != null)
          FirestoreWhere('companyId', filters.companyId),
        if (filters.status != null) FirestoreWhere('status', filters.status),
      ],
    );
  }

  Future<String> createCompanyEnquiry(CompanyEnquiryData data) async {
    final docRef = await _collection('leads').add({
      'companyId': data.companyId,
      'companyName': data.companyName,
      'company': data.companyName,
      'ownerId': data.ownerId,
      'name': data.name,
      'contactName': data.name,
      'customerName': data.name,
      'phone': data.phone,
      'contactPhone': data.phone,
      'customerPhone': data.phone,
      if (data.email != null) 'email': data.email,
      if (data.email != null) 'customerEmail': data.email,
      if (data.userId != null) 'userId': data.userId,
      'message': data.message,
      'service': data.category ?? 'Business inquiry',
      'type': 'business',
      'source': 'public_company_profile',
      'district': data.district ?? '',
      'status': 'new',
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    await _doc('companies', data.companyId).update({
      'enquiryCount': FieldValue.increment(1),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    if (data.ownerId.isNotEmpty && data.ownerId == _auth.currentUser?.uid) {
      await createNotification(
        NotificationData(
          userId: data.ownerId,
          type: 'lead',
          title: 'New Business Enquiry',
          message: '${data.name} sent an enquiry for ${data.companyName}.',
          actionUrl: '/employer/leads',
        ),
      );
    }

    return docRef.id;
  }

  Future<void> updateLeadStatus(String leadId, String status, {String? notes}) {
    return updateDocument('leads', leadId, {
      'status': status,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
  }

  Future<List<FirestoreDocument>> getReviews({String? targetId}) {
    if (targetId == null) return fetchCollection('reviews');

    return fetchCollection('reviews').then((docs) {
      return docs
          .where(
            (doc) =>
                doc['targetId'] == targetId || doc['companyId'] == targetId,
          )
          .toList();
    });
  }

  Future<String> createCompanyReview(CompanyReviewData data) async {
    final docRef = await _collection('reviews').add({
      'targetId': data.companyId,
      'targetName': data.companyName,
      'targetType': 'business',
      'companyId': data.companyId,
      'companyName': data.companyName,
      'reviewerId': data.reviewerId,
      'reviewerName': data.reviewerName,
      'userName': data.reviewerName,
      'rating': data.rating,
      'title': data.title,
      'content': data.content,
      'comment': data.content,
      'text': data.content,
      'type': data.reviewType,
      'status': 'pending',
      'isVerified': false,
      'helpful': 0,
      'unhelpful': 0,
      'helpfulCount': 0,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    return docRef.id;
  }

  Future<List<FirestoreDocument>> getInterviews([
    InterviewFilters filters = const InterviewFilters(),
  ]) {
    return fetchCollection(
      'interviews',
      filters: [
        if (filters.seekerId != null)
          FirestoreWhere('seekerId', filters.seekerId),
        if (filters.employerId != null)
          FirestoreWhere('employerId', filters.employerId),
        if (filters.companyId != null)
          FirestoreWhere('companyId', filters.companyId),
      ],
    );
  }

  Future<DocumentReference<FirestoreDocument>> createNotification(
    NotificationData data,
  ) {
    return _collection('notifications').add({
      ...data.toFirestore(),
      'createdBy': _auth.currentUser?.uid ?? data.userId,
      'read': false,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  Future<List<FirestoreDocument>> getNotifications(String userId) {
    return fetchCollection(
      'notifications',
      filters: [FirestoreWhere('userId', userId)],
      orderBy: const [FirestoreOrder('createdAt', descending: true)],
      limitCount: 50,
    );
  }

  Stream<List<FirestoreDocument>> streamNotifications(String userId) {
    return streamCollection(
      'notifications',
      filters: [FirestoreWhere('userId', userId)],
      orderBy: const [FirestoreOrder('createdAt', descending: true)],
      limitCount: 50,
    );
  }

  Future<void> markNotificationRead(String notificationId) {
    return updateDocument('notifications', notificationId, {'read': true});
  }

  Future<void> markAllNotificationsRead(String userId) async {
    final unread = await fetchCollection(
      'notifications',
      filters: [
        FirestoreWhere('userId', userId),
        const FirestoreWhere('read', false),
      ],
    );

    final batch = _firestore.batch();
    for (final notification in unread) {
      batch.update(_doc('notifications', notification['id'] as String), {
        'read': true,
      });
    }
    await batch.commit();
  }

  Future<void> approveCompany(String companyId, String adminId) async {
    await _callFunction('approveCompany', {'id': companyId});
  }

  Future<void> rejectCompany(
    String companyId,
    String adminId, {
    String? reason,
  }) async {
    await _callFunction('rejectCompany', {
      'id': companyId,
      if (reason != null && reason.isNotEmpty) 'reason': reason,
    });
  }

  Future<void> featureCompany(String companyId, bool isFeatured) {
    return updateDocument('companies', companyId, {'isFeatured': isFeatured});
  }

  Future<void> verifyCompany(String companyId) {
    return updateDocument('companies', companyId, {
      'verificationBadges.businessVerified': true,
    });
  }

  Future<void> approveJob(String jobId, String adminId) async {
    await _callFunction('approveJob', {'id': jobId});
  }

  Future<void> rejectJob(String jobId, String adminId) async {
    await _callFunction('rejectJob', {'id': jobId});
  }

  Future<void> updateUserRole(String uid, String role, String adminId) async {
    await _callFunction('updateUserRole', {'userId': uid, 'role': role});
  }

  Future<void> verifyUser(String uid, String adminId) async {
    await _callFunction('verifyUser', {'userId': uid});
  }

  Future<List<FirestoreDocument>> getUsers([
    UserFilters filters = const UserFilters(),
  ]) {
    return fetchCollection(
      'users',
      filters: [
        if (filters.role != null) FirestoreWhere('role', filters.role),
        if (filters.isVerified != null)
          FirestoreWhere('isVerified', filters.isVerified),
      ],
      limitCount: filters.limitCount,
    );
  }

  Future<List<FirestoreDocument>> getServices([
    ServiceFilters filters = const ServiceFilters(),
  ]) async {
    final docs = await fetchCollection(
      'services',
      filters: [
        if (filters.status != null) FirestoreWhere('status', filters.status),
        if (filters.category != null)
          FirestoreWhere('category', filters.category),
        if (filters.district != null)
          FirestoreWhere('district', filters.district),
        if (filters.providerId != null)
          FirestoreWhere('providerId', filters.providerId),
      ],
    );
    return _filterSearch(docs, filters.search, [
      'name',
      'title',
      'description',
      'category',
      'district',
    ]);
  }

  Future<List<FirestoreDocument>> getSubscriptions([
    SubscriptionFilters filters = const SubscriptionFilters(),
  ]) {
    return fetchCollection(
      'subscriptions',
      filters: [
        if (filters.userId != null) FirestoreWhere('userId', filters.userId),
        if (filters.companyId != null)
          FirestoreWhere('companyId', filters.companyId),
        if (filters.status != null) FirestoreWhere('status', filters.status),
      ],
    );
  }

  Future<List<FirestoreDocument>> getPayments([
    PaymentFilters filters = const PaymentFilters(),
  ]) {
    return fetchCollection(
      'payments',
      filters: [
        if (filters.userId != null) FirestoreWhere('userId', filters.userId),
        if (filters.companyId != null)
          FirestoreWhere('companyId', filters.companyId),
        if (filters.status != null) FirestoreWhere('status', filters.status),
      ],
    );
  }

  Future<List<FirestoreDocument>> getAdvertisements([
    AdvertisementFilters filters = const AdvertisementFilters(),
  ]) {
    return fetchCollection(
      'advertisements',
      filters: [
        if (filters.status != null) FirestoreWhere('status', filters.status),
      ],
    );
  }

  Future<DocumentReference<FirestoreDocument>> logActivity(
    ActivityLogData data,
  ) {
    return _collection(
      'activityLogs',
    ).add({...data.toFirestore(), 'timestamp': FieldValue.serverTimestamp()});
  }

  Future<List<FirestoreDocument>> getActivityLogs({int limitCount = 20}) {
    return fetchCollection(
      'activityLogs',
      orderBy: const [FirestoreOrder('timestamp', descending: true)],
      limitCount: limitCount,
    );
  }

  Future<String> createDocument(
    String collectionPath,
    FirestoreDocument data,
  ) async {
    final docRef = await _collection(collectionPath).add({
      ...data,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    return docRef.id;
  }

  Future<void> updateDocument(
    String collectionPath,
    String docId,
    FirestoreDocument data,
  ) {
    return _doc(
      collectionPath,
      docId,
    ).update({...data, 'updatedAt': FieldValue.serverTimestamp()});
  }

  Future<void> deleteDocument(String collectionPath, String docId) {
    return _doc(collectionPath, docId).delete();
  }

  Future<String> createConversation(ConversationData data) async {
    final participants = [...data.participants]..sort();
    final existing = await fetchCollection(
      'conversations',
      filters: [
        FirestoreWhere('participants', participants),
        if (data.jobId != null) FirestoreWhere('jobId', data.jobId),
      ],
      limitCount: 1,
    );

    if (existing.isNotEmpty) return existing.first['id'] as String;

    final unreadCounts = <String, int>{for (final id in participants) id: 0};
    final docRef = await _collection('conversations').add({
      'participants': participants,
      'participantNames': data.participantNames,
      'participantRoles': data.participantRoles,
      if (data.participantPhotos != null)
        'participantPhotos': data.participantPhotos,
      if (data.jobId != null) 'jobId': data.jobId,
      if (data.jobTitle != null) 'jobTitle': data.jobTitle,
      if (data.companyId != null) 'companyId': data.companyId,
      'lastMessage': '',
      'lastMessageAt': FieldValue.serverTimestamp(),
      'typingUsers': <String>[],
      'unreadCounts': unreadCounts,
      'status': 'active',
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    return docRef.id;
  }

  Future<List<FirestoreDocument>> getConversations(String userId) {
    return fetchCollection(
      'conversations',
      filters: [
        FirestoreWhere(
          'participants',
          userId,
          operator: FirestoreOperator.arrayContains,
        ),
        const FirestoreWhere('status', 'active'),
      ],
      orderBy: const [FirestoreOrder('lastMessageAt', descending: true)],
    );
  }

  Stream<List<FirestoreDocument>> streamConversations(String userId) {
    return streamCollection(
      'conversations',
      filters: [
        FirestoreWhere(
          'participants',
          userId,
          operator: FirestoreOperator.arrayContains,
        ),
        const FirestoreWhere('status', 'active'),
      ],
      orderBy: const [FirestoreOrder('lastMessageAt', descending: true)],
    );
  }

  Future<String> sendChatMessage(
    String conversationId,
    ChatMessageData data,
  ) async {
    final msgRef = await _collection('conversations/$conversationId/messages')
        .add({
          'conversationId': conversationId,
          'senderId': data.senderId,
          'senderName': data.senderName,
          'senderRole': data.senderRole,
          'text': data.text,
          'type': data.type,
          if (data.attachments.isNotEmpty)
            'attachments': data.attachments
                .map((item) => item.toFirestore())
                .toList(),
          'read': false,
          'createdAt': FieldValue.serverTimestamp(),
        });

    await updateDocument('conversations', conversationId, {
      'lastMessage': data.text,
      'lastMessageAt': FieldValue.serverTimestamp(),
      'lastMessageSenderId': data.senderId,
    });

    return msgRef.id;
  }

  Stream<List<FirestoreDocument>> streamChatMessages(String conversationId) {
    return streamCollection(
      'conversations/$conversationId/messages',
      orderBy: const [FirestoreOrder('createdAt')],
    );
  }

  Future<void> markMessagesRead(String conversationId, String userId) async {
    final messages = await fetchCollection(
      'conversations/$conversationId/messages',
      filters: const [FirestoreWhere('read', false)],
    );

    final batch = _firestore.batch();
    for (final message in messages) {
      if (message['senderId'] == userId) continue;
      batch.update(
        _doc('conversations/$conversationId/messages', message['id'] as String),
        {'read': true, 'readAt': FieldValue.serverTimestamp()},
      );
    }
    await batch.commit();
  }

  Future<void> setTypingStatus(
    String conversationId,
    String userId,
    bool isTyping,
  ) {
    return _doc('conversations', conversationId).update({
      'typingUsers': isTyping
          ? FieldValue.arrayUnion([userId])
          : FieldValue.arrayRemove([userId]),
    });
  }

  Future<bool> awardPoints(
    String userId, {
    required String activityType,
    required int points,
    required String description,
  }) async {
    final profileRef = _doc('gamification', userId);

    await _firestore.runTransaction((transaction) async {
      final profile = await transaction.get(profileRef);
      if (profile.exists) {
        transaction.update(profileRef, {
          'rewards.current': FieldValue.increment(points),
          'rewards.total': FieldValue.increment(points),
          'rewards.monthlyPoints': FieldValue.increment(points),
          'rewards.lastEarnedAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });
      } else {
        transaction.set(profileRef, {
          'uid': userId,
          'rewards': {
            'current': points,
            'total': points,
            'monthlyPoints': points,
            'monthStartDate': FieldValue.serverTimestamp(),
            'lastEarnedAt': FieldValue.serverTimestamp(),
          },
          'badges': <FirestoreDocument>[],
          'achievements': <FirestoreDocument>[],
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
    });

    await _collection('gamification/$userId/activities').add({
      'type': activityType,
      'points': points,
      'description': description,
      'earnedAt': FieldValue.serverTimestamp(),
    });

    return true;
  }

  Future<FirestoreDocument?> getGamificationProfile(String userId) {
    return fetchDocument('gamification', userId);
  }

  Future<List<FirestoreDocument>> getPointActivities(
    String userId, {
    int limitCount = 20,
  }) {
    return fetchCollection(
      'gamification/$userId/activities',
      orderBy: const [FirestoreOrder('earnedAt', descending: true)],
      limitCount: limitCount,
    );
  }

  Future<void> awardBadge(String userId, BadgeData badge) async {
    await _doc('gamification', userId).update({
      'badges': FieldValue.arrayUnion([
        {
          'id': badge.id,
          'name': badge.name,
          'icon': badge.icon,
          'description': badge.description,
          'earnedAt': Timestamp.now(),
          'displayOnProfile': true,
        },
      ]),
      'updatedAt': FieldValue.serverTimestamp(),
    });

    await createNotification(
      NotificationData(
        userId: userId,
        type: 'system',
        title: 'Badge Earned: ${badge.name}',
        message: badge.description,
      ),
    );
  }

  Future<List<FirestoreDocument>> getLeaderboard({int limitCount = 20}) {
    return fetchCollection(
      'gamification',
      orderBy: const [
        FirestoreOrder('rewards.monthlyPoints', descending: true),
      ],
      limitCount: limitCount,
    );
  }

  Future<void> updateAchievementProgress(
    String userId,
    String achievementId, {
    required int progress,
    required int maxProgress,
  }) async {
    final profileRef = _doc('gamification', userId);
    final profileSnap = await profileRef.get();
    if (!profileSnap.exists) return;

    final data = profileSnap.data() ?? <String, dynamic>{};
    final achievements = (data['achievements'] as List<dynamic>? ?? [])
        .cast<Object?>();
    FirestoreDocument? existing;
    for (final item in achievements) {
      if (item is Map && item['id'] == achievementId) {
        existing = Map<String, dynamic>.from(item);
        break;
      }
    }

    if (existing != null && existing['completed'] == true) return;

    final completed = progress >= maxProgress;
    final updated = <String, dynamic>{
      'id': achievementId,
      'progress': progress > maxProgress ? maxProgress : progress,
      'maxProgress': maxProgress,
      'completed': completed,
      if (completed) 'earnedAt': Timestamp.now(),
    };

    if (existing != null) {
      await profileRef.update({
        'achievements': FieldValue.arrayRemove([existing]),
      });
    }

    await profileRef.update({
      'achievements': FieldValue.arrayUnion([updated]),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  Future<FirestoreDocument> getSeekerAnalytics(String seekerId) async {
    final applications = await getApplications(
      ApplicationFilters(seekerId: seekerId),
    );
    final total = applications.length;
    final viewed = applications
        .where((item) => item['viewedAt'] != null)
        .length;
    final responded = applications.where((item) {
      return item['respondedAt'] != null || item['status'] != 'applied';
    }).length;
    final interviewed = applications
        .where((item) => item['status'] == 'interview_scheduled')
        .length;
    final offers = applications
        .where((item) => item['status'] == 'selected')
        .length;
    final rejected = applications
        .where((item) => item['status'] == 'rejected')
        .length;

    var profileViews = 0;
    try {
      final profile = await fetchDocument('seekerProfiles', seekerId);
      profileViews = ((profile?['viewCount'] as num?) ?? 0).toInt();
    } catch (_) {
      profileViews = 0;
    }

    return {
      'totalApplications': total,
      'viewedCount': viewed,
      'respondedCount': responded,
      'interviewCount': interviewed,
      'offerCount': offers,
      'rejectedCount': rejected,
      'viewRate': total > 0 ? ((viewed / total) * 100).round() : 0,
      'responseRate': total > 0 ? ((responded / total) * 100).round() : 0,
      'interviewRate': responded > 0
          ? ((interviewed / responded) * 100).round()
          : 0,
      'offerRate': interviewed > 0 ? ((offers / interviewed) * 100).round() : 0,
      'avgTimeToFirstReply': 2.3,
      'profileViews': profileViews,
      'weeklyApplicationTrend': [3, 5, 2, 7, 4, 6, total > 6 ? 3 : 1],
      'topMatchedSkills': <String>[],
      'topMissingSkills': <String>[],
    };
  }

  Future<FirestoreDocument> getEmployerAnalytics(String companyId) async {
    final jobs = await getJobs(JobFilters(companyId: companyId));
    final jobIds = jobs.map((job) => job['id'] as String).take(10);

    final allApplications = <FirestoreDocument>[];
    for (final jobId in jobIds) {
      final applications = await getApplications(
        ApplicationFilters(jobId: jobId),
      );
      allApplications.addAll(applications);
    }

    final applied = allApplications.length;
    final shortlisted = allApplications
        .where((item) => item['status'] == 'shortlisted')
        .length;
    final interviewed = allApplications
        .where((item) => item['status'] == 'interview_scheduled')
        .length;
    final selected = allApplications
        .where((item) => item['status'] == 'selected')
        .length;
    final rejected = allApplications
        .where((item) => item['status'] == 'rejected')
        .length;

    return {
      'activeJobs': jobs.where((job) => job['isActive'] == true).length,
      'totalApplications': applied,
      'avgApplicationsPerJob': jobs.isNotEmpty
          ? (applied / jobs.length).round()
          : 0,
      'timeToHire': 18,
      'offerAcceptanceRate': selected > 0
          ? ((selected / (selected + rejected)) * 100).round()
          : 0,
      'costPerHire': 2400,
      'hiringFunnel': {
        'applied': applied,
        'screened': (applied * 0.35).round(),
        'shortlisted': shortlisted,
        'interviewed': interviewed,
        'offered': selected,
        'accepted': (selected * 0.75).round(),
      },
      'jobWiseBreakdown': jobs.take(5).map((job) {
        final jobId = job['id'] as String;
        final jobApplications = allApplications
            .where((item) => item['jobId'] == jobId)
            .toList();
        return {
          'jobId': jobId,
          'jobTitle': job['title'] ?? 'Untitled',
          'applications': jobApplications.length,
          'qualified': jobApplications
              .where((item) => item['status'] == 'shortlisted')
              .length,
          'hired': jobApplications
              .where((item) => item['status'] == 'selected')
              .length,
          'qualityScore': 8,
        };
      }).toList(),
      'candidateSources': {
        'Platform recommendations': 45,
        'Direct applications': 32,
        'Employer invites': 18,
        'Referrals': 5,
      },
    };
  }
}

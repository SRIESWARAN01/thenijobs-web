import 'package:cloud_firestore/cloud_firestore.dart';

enum ReviewTargetType {
  company,
  employer,
  service;

  static ReviewTargetType fromString(String value) {
    switch (value) {
      case 'company':
      case 'business':
        return ReviewTargetType.company;
      case 'employer':
        return ReviewTargetType.employer;
      case 'service':
        return ReviewTargetType.service;
      default:
        throw ArgumentError('Unknown ReviewTargetType: $value');
    }
  }

  String toJson() {
    switch (this) {
      case ReviewTargetType.company:
        return 'company';
      case ReviewTargetType.employer:
        return 'employer';
      case ReviewTargetType.service:
        return 'service';
    }
  }
}

class Review {
  final String id;
  final String targetId;
  final ReviewTargetType targetType;
  final String reviewerId;
  final String reviewerName;
  final String? reviewerPhoto;
  final double rating;
  final String title;
  final String content;
  final bool isVerified;
  final int helpfulCount;
  final String? reply;
  final DateTime createdAt;

  Review({
    required this.id,
    required this.targetId,
    required this.targetType,
    required this.reviewerId,
    required this.reviewerName,
    this.reviewerPhoto,
    required this.rating,
    required this.title,
    required this.content,
    required this.isVerified,
    required this.helpfulCount,
    this.reply,
    required this.createdAt,
  });

  factory Review.fromFirestore(Map<String, dynamic> data, String id) {
    return Review(
      id: id,
      targetId:
          data['targetId'] as String? ?? data['companyId'] as String? ?? '',
      targetType: data['targetType'] != null
          ? ReviewTargetType.fromString(data['targetType'] as String)
          : ReviewTargetType.company,
      reviewerId: data['reviewerId'] as String? ?? '',
      reviewerName:
          data['reviewerName'] as String? ?? data['userName'] as String? ?? '',
      reviewerPhoto: data['reviewerPhoto'] as String?,
      rating: (data['rating'] as num? ?? 0.0).toDouble(),
      title: data['title'] as String? ?? '',
      content:
          data['content'] as String? ??
          data['comment'] as String? ??
          data['text'] as String? ??
          '',
      isVerified: data['isVerified'] as bool? ?? (data['status'] == 'approved'),
      helpfulCount:
          (data['helpfulCount'] as num? ?? data['helpful'] as num? ?? 0)
              .toInt(),
      reply: data['reply'] as String? ?? data['replyText'] as String?,
      createdAt: data['createdAt'] != null
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'targetId': targetId,
      'targetType': targetType.toJson(),
      'reviewerId': reviewerId,
      'reviewerName': reviewerName,
      if (reviewerPhoto != null) 'reviewerPhoto': reviewerPhoto,
      'rating': rating,
      'title': title,
      'content': content,
      'isVerified': isVerified,
      'helpfulCount': helpfulCount,
      if (reply != null) 'reply': reply,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }
}

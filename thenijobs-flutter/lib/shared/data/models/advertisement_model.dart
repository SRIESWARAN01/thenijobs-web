import 'package:cloud_firestore/cloud_firestore.dart';

enum AdvertisementType {
  banner,
  sponsored,
  featured;

  static AdvertisementType fromString(String value) {
    switch (value) {
      case 'banner':
        return AdvertisementType.banner;
      case 'sponsored':
        return AdvertisementType.sponsored;
      case 'featured':
        return AdvertisementType.featured;
      default:
        throw ArgumentError('Unknown AdvertisementType: $value');
    }
  }

  String toJson() {
    switch (this) {
      case AdvertisementType.banner:
        return 'banner';
      case AdvertisementType.sponsored:
        return 'sponsored';
      case AdvertisementType.featured:
        return 'featured';
    }
  }
}

enum AdvertisementStatus {
  active,
  paused,
  expired,
  draft;

  static AdvertisementStatus fromString(String value) {
    switch (value) {
      case 'active':
        return AdvertisementStatus.active;
      case 'paused':
        return AdvertisementStatus.paused;
      case 'expired':
        return AdvertisementStatus.expired;
      case 'draft':
        return AdvertisementStatus.draft;
      default:
        throw ArgumentError('Unknown AdvertisementStatus: $value');
    }
  }

  String toJson() {
    switch (this) {
      case AdvertisementStatus.active:
        return 'active';
      case AdvertisementStatus.paused:
        return 'paused';
      case AdvertisementStatus.expired:
        return 'expired';
      case AdvertisementStatus.draft:
        return 'draft';
    }
  }
}

class Advertisement {
  final String id;
  final AdvertisementType type;
  final String title;
  final String imageUrl;
  final String targetUrl;
  final String placement;
  final DateTime startDate;
  final DateTime endDate;
  final int impressions;
  final int clicks;
  final AdvertisementStatus status;
  final DateTime createdAt;

  Advertisement({
    required this.id,
    required this.type,
    required this.title,
    required this.imageUrl,
    required this.targetUrl,
    required this.placement,
    required this.startDate,
    required this.endDate,
    required this.impressions,
    required this.clicks,
    required this.status,
    required this.createdAt,
  });

  factory Advertisement.fromFirestore(Map<String, dynamic> data, String id) {
    return Advertisement(
      id: id,
      type: data['type'] != null
          ? AdvertisementType.fromString(data['type'] as String)
          : AdvertisementType.banner,
      title: data['title'] as String? ?? '',
      imageUrl: data['imageUrl'] as String? ?? '',
      targetUrl: data['targetUrl'] as String? ?? '',
      placement: data['placement'] as String? ?? '',
      startDate: data['startDate'] != null
          ? (data['startDate'] as Timestamp).toDate()
          : DateTime.now(),
      endDate: data['endDate'] != null
          ? (data['endDate'] as Timestamp).toDate()
          : DateTime.now(),
      impressions: (data['impressions'] as num? ?? 0).toInt(),
      clicks: (data['clicks'] as num? ?? 0).toInt(),
      status: data['status'] != null
          ? AdvertisementStatus.fromString(data['status'] as String)
          : AdvertisementStatus.draft,
      createdAt: data['createdAt'] != null
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'type': type.toJson(),
      'title': title,
      'imageUrl': imageUrl,
      'targetUrl': targetUrl,
      'placement': placement,
      'startDate': Timestamp.fromDate(startDate),
      'endDate': Timestamp.fromDate(endDate),
      'impressions': impressions,
      'clicks': clicks,
      'status': status.toJson(),
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }
}

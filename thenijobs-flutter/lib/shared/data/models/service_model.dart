import 'package:cloud_firestore/cloud_firestore.dart';

enum ServiceStatus {
  active,
  pending,
  paused,
  rejected;

  static ServiceStatus fromString(String value) {
    switch (value) {
      case 'active':
        return ServiceStatus.active;
      case 'pending':
        return ServiceStatus.pending;
      case 'paused':
        return ServiceStatus.paused;
      case 'rejected':
        return ServiceStatus.rejected;
      default:
        throw ArgumentError('Unknown ServiceStatus: $value');
    }
  }

  String toJson() {
    switch (this) {
      case ServiceStatus.active:
        return 'active';
      case ServiceStatus.pending:
        return 'pending';
      case ServiceStatus.paused:
        return 'paused';
      case ServiceStatus.rejected:
        return 'rejected';
    }
  }
}

enum ServiceRequestStatus {
  pending,
  accepted,
  rejected,
  completed;

  static ServiceRequestStatus fromString(String value) {
    switch (value) {
      case 'pending':
        return ServiceRequestStatus.pending;
      case 'accepted':
        return ServiceRequestStatus.accepted;
      case 'rejected':
        return ServiceRequestStatus.rejected;
      case 'completed':
        return ServiceRequestStatus.completed;
      default:
        throw ArgumentError('Unknown ServiceRequestStatus: $value');
    }
  }

  String toJson() {
    switch (this) {
      case ServiceRequestStatus.pending:
        return 'pending';
      case ServiceRequestStatus.accepted:
        return 'accepted';
      case ServiceRequestStatus.rejected:
        return 'rejected';
      case ServiceRequestStatus.completed:
        return 'completed';
    }
  }
}

class Service {
  final String id;
  final String providerId;
  final String providerName;
  final String name;
  final String category;
  final String description;
  final String? pricing;
  final String district;
  final ServiceStatus status;
  final List<String> images;
  final double rating;
  final int reviewCount;
  final int enquiryCount;
  final bool isFeatured;
  final DateTime createdAt;
  final DateTime updatedAt;

  Service({
    required this.id,
    required this.providerId,
    required this.providerName,
    required this.name,
    required this.category,
    required this.description,
    this.pricing,
    required this.district,
    required this.status,
    required this.images,
    required this.rating,
    required this.reviewCount,
    required this.enquiryCount,
    required this.isFeatured,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Service.fromFirestore(Map<String, dynamic> data, String id) {
    return Service(
      id: id,
      providerId: data['providerId'] as String? ?? '',
      providerName: data['providerName'] as String? ?? '',
      name: data['name'] as String? ?? '',
      category: data['category'] as String? ?? '',
      description: data['description'] as String? ?? '',
      pricing: data['pricing'] as String?,
      district: data['district'] as String? ?? '',
      status: data['status'] != null
          ? ServiceStatus.fromString(data['status'] as String)
          : ServiceStatus.pending,
      images:
          (data['images'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      rating: (data['rating'] as num? ?? 0.0).toDouble(),
      reviewCount: (data['reviewCount'] as num? ?? 0).toInt(),
      enquiryCount: (data['enquiryCount'] as num? ?? 0).toInt(),
      isFeatured: data['isFeatured'] as bool? ?? false,
      createdAt: data['createdAt'] != null
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
      updatedAt: data['updatedAt'] != null
          ? (data['updatedAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'providerId': providerId,
      'providerName': providerName,
      'name': name,
      'category': category,
      'description': description,
      if (pricing != null) 'pricing': pricing,
      'district': district,
      'status': status.toJson(),
      'images': images,
      'rating': rating,
      'reviewCount': reviewCount,
      'enquiryCount': enquiryCount,
      'isFeatured': isFeatured,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }
}

class ServiceRequest {
  final String id;
  final String serviceId;
  final String requesterId;
  final String requesterName;
  final String phone;
  final String? message;
  final ServiceRequestStatus status;
  final DateTime createdAt;

  ServiceRequest({
    required this.id,
    required this.serviceId,
    required this.requesterId,
    required this.requesterName,
    required this.phone,
    this.message,
    required this.status,
    required this.createdAt,
  });

  factory ServiceRequest.fromFirestore(Map<String, dynamic> data, String id) {
    return ServiceRequest(
      id: id,
      serviceId: data['serviceId'] as String? ?? '',
      requesterId: data['requesterId'] as String? ?? '',
      requesterName: data['requesterName'] as String? ?? '',
      phone: data['phone'] as String? ?? '',
      message: data['message'] as String?,
      status: data['status'] != null
          ? ServiceRequestStatus.fromString(data['status'] as String)
          : ServiceRequestStatus.pending,
      createdAt: data['createdAt'] != null
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'serviceId': serviceId,
      'requesterId': requesterId,
      'requesterName': requesterName,
      'phone': phone,
      if (message != null) 'message': message,
      'status': status.toJson(),
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }
}

import 'package:cloud_firestore/cloud_firestore.dart';

enum VerificationStatus {
  pending,
  verified,
  rejected;

  static VerificationStatus fromString(String value) {
    switch (value) {
      case 'pending':
        return VerificationStatus.pending;
      case 'verified':
        return VerificationStatus.verified;
      case 'rejected':
        return VerificationStatus.rejected;
      default:
        throw ArgumentError('Unknown VerificationStatus: $value');
    }
  }

  String toJson() {
    switch (this) {
      case VerificationStatus.pending:
        return 'pending';
      case VerificationStatus.verified:
        return 'verified';
      case VerificationStatus.rejected:
        return 'rejected';
    }
  }
}

class VerificationBadges {
  final bool mobileVerified;
  final bool emailVerified;
  final bool gstVerified;
  final bool businessVerified;

  VerificationBadges({
    required this.mobileVerified,
    required this.emailVerified,
    required this.gstVerified,
    required this.businessVerified,
  });

  factory VerificationBadges.fromMap(Map<String, dynamic> data) {
    return VerificationBadges(
      mobileVerified: data['mobileVerified'] as bool? ?? false,
      emailVerified: data['emailVerified'] as bool? ?? false,
      gstVerified: data['gstVerified'] as bool? ?? false,
      businessVerified: data['businessVerified'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'mobileVerified': mobileVerified,
      'emailVerified': emailVerified,
      'gstVerified': gstVerified,
      'businessVerified': businessVerified,
    };
  }
}

class Company {
  final String id;
  final String slug;
  final String ownerId;
  final String name;
  final String? logoUrl;
  final String? coverImageUrl;
  final String category;
  final String? subcategory;
  final int? foundedYear;
  final String? companySize;
  final String? gstNumber;
  final String? registrationNumber;
  final String description;
  final String phone;
  final String? alternatePhone;
  final String email;
  final String? website;
  final String? whatsapp;
  final String address;
  final String district;
  final String state;
  final String country;
  final double? latitude;
  final double? longitude;
  final String? mapEmbedUrl;
  final String? facebook;
  final String? instagram;
  final String? linkedin;
  final String? youtube;
  final List<String> galleryImages;
  final List<String> galleryVideos;
  final List<String> services;
  final VerificationStatus verificationStatus;
  final VerificationBadges verificationBadges;
  final bool isActive;
  final bool isFeatured;
  final bool isPremium;
  final int viewCount;
  final int enquiryCount;
  final double rating;
  final int reviewCount;
  final String? metaTitle;
  final String? metaDescription;
  final DateTime createdAt;
  final DateTime updatedAt;

  Company({
    required this.id,
    required this.slug,
    required this.ownerId,
    required this.name,
    this.logoUrl,
    this.coverImageUrl,
    required this.category,
    this.subcategory,
    this.foundedYear,
    this.companySize,
    this.gstNumber,
    this.registrationNumber,
    required this.description,
    required this.phone,
    this.alternatePhone,
    required this.email,
    this.website,
    this.whatsapp,
    required this.address,
    required this.district,
    required this.state,
    required this.country,
    this.latitude,
    this.longitude,
    this.mapEmbedUrl,
    this.facebook,
    this.instagram,
    this.linkedin,
    this.youtube,
    required this.galleryImages,
    required this.galleryVideos,
    required this.services,
    required this.verificationStatus,
    required this.verificationBadges,
    required this.isActive,
    required this.isFeatured,
    required this.isPremium,
    required this.viewCount,
    required this.enquiryCount,
    required this.rating,
    required this.reviewCount,
    this.metaTitle,
    this.metaDescription,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Company.fromFirestore(Map<String, dynamic> data, String id) {
    return Company(
      id: id,
      slug: data['slug'] as String? ?? '',
      ownerId: data['ownerId'] as String? ?? '',
      name: data['name'] as String? ?? '',
      logoUrl: data['logoUrl'] as String?,
      coverImageUrl: data['coverImageUrl'] as String?,
      category: data['category'] as String? ?? '',
      subcategory: data['subcategory'] as String?,
      foundedYear: (data['foundedYear'] as num?)?.toInt(),
      companySize: data['companySize'] as String?,
      gstNumber: data['gstNumber'] as String?,
      registrationNumber: data['registrationNumber'] as String?,
      description: data['description'] as String? ?? '',
      phone: data['phone'] as String? ?? '',
      alternatePhone: data['alternatePhone'] as String?,
      email: data['email'] as String? ?? '',
      website: data['website'] as String?,
      whatsapp: data['whatsapp'] as String?,
      address: data['address'] as String? ?? '',
      district: data['district'] as String? ?? '',
      state: data['state'] as String? ?? '',
      country: data['country'] as String? ?? '',
      latitude: (data['latitude'] as num?)?.toDouble(),
      longitude: (data['longitude'] as num?)?.toDouble(),
      mapEmbedUrl: data['mapEmbedUrl'] as String?,
      facebook: data['facebook'] as String?,
      instagram: data['instagram'] as String?,
      linkedin: data['linkedin'] as String?,
      youtube: data['youtube'] as String?,
      galleryImages:
          (data['galleryImages'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      galleryVideos:
          (data['galleryVideos'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      services:
          (data['services'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      verificationStatus: data['verificationStatus'] != null
          ? VerificationStatus.fromString(data['verificationStatus'] as String)
          : VerificationStatus.pending,
      verificationBadges: data['verificationBadges'] != null
          ? VerificationBadges.fromMap(
              data['verificationBadges'] as Map<String, dynamic>,
            )
          : VerificationBadges(
              mobileVerified: false,
              emailVerified: false,
              gstVerified: false,
              businessVerified: false,
            ),
      isActive: data['isActive'] as bool? ?? false,
      isFeatured: data['isFeatured'] as bool? ?? false,
      isPremium: data['isPremium'] as bool? ?? false,
      viewCount: (data['viewCount'] as num? ?? 0).toInt(),
      enquiryCount: (data['enquiryCount'] as num? ?? 0).toInt(),
      rating: (data['rating'] as num? ?? 0.0).toDouble(),
      reviewCount: (data['reviewCount'] as num? ?? 0).toInt(),
      metaTitle: data['metaTitle'] as String?,
      metaDescription: data['metaDescription'] as String?,
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
      'slug': slug,
      'ownerId': ownerId,
      'name': name,
      if (logoUrl != null) 'logoUrl': logoUrl,
      if (coverImageUrl != null) 'coverImageUrl': coverImageUrl,
      'category': category,
      if (subcategory != null) 'subcategory': subcategory,
      if (foundedYear != null) 'foundedYear': foundedYear,
      if (companySize != null) 'companySize': companySize,
      if (gstNumber != null) 'gstNumber': gstNumber,
      if (registrationNumber != null) 'registrationNumber': registrationNumber,
      'description': description,
      'phone': phone,
      if (alternatePhone != null) 'alternatePhone': alternatePhone,
      'email': email,
      if (website != null) 'website': website,
      if (whatsapp != null) 'whatsapp': whatsapp,
      'address': address,
      'district': district,
      'state': state,
      'country': country,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (mapEmbedUrl != null) 'mapEmbedUrl': mapEmbedUrl,
      if (facebook != null) 'facebook': facebook,
      if (instagram != null) 'instagram': instagram,
      if (linkedin != null) 'linkedin': linkedin,
      if (youtube != null) 'youtube': youtube,
      'galleryImages': galleryImages,
      'galleryVideos': galleryVideos,
      'services': services,
      'verificationStatus': verificationStatus.toJson(),
      'verificationBadges': verificationBadges.toMap(),
      'isActive': isActive,
      'isFeatured': isFeatured,
      'isPremium': isPremium,
      'viewCount': viewCount,
      'enquiryCount': enquiryCount,
      'rating': rating,
      'reviewCount': reviewCount,
      if (metaTitle != null) 'metaTitle': metaTitle,
      if (metaDescription != null) 'metaDescription': metaDescription,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }
}

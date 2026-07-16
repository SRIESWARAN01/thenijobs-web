import 'package:thenijobs/utils/helpers.dart';

// ===== VERIFICATION =====

enum VerificationStatus {
  pending('pending'),
  verified('verified'),
  rejected('rejected');

  final String value;
  const VerificationStatus(this.value);

  static VerificationStatus fromString(String? value) {
    return VerificationStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => VerificationStatus.pending,
    );
  }
}

class VerificationBadges {
  final bool emailVerified;
  final bool gstVerified;
  final bool businessVerified;

  const VerificationBadges({
    this.emailVerified = false,
    this.gstVerified = false,
    this.businessVerified = false,
  });

  factory VerificationBadges.fromMap(Map<String, dynamic>? map) {
    if (map == null) return const VerificationBadges();
    return VerificationBadges(
      emailVerified: map['emailVerified'] ?? false,
      gstVerified: map['gstVerified'] ?? false,
      businessVerified: map['businessVerified'] ?? false,
    );
  }

  Map<String, dynamic> toMap() => {
    'emailVerified': emailVerified,
    'gstVerified': gstVerified,
    'businessVerified': businessVerified,
  };
}

// ===== COMPANY =====

class Company {
  final String id;
  final String slug;
  final String ownerId;
  // Basic Info
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
  // Contact
  final String phone;
  final String? alternatePhone;
  final String email;
  final String? website;
  final String? whatsapp;
  // Location
  final String address;
  final String? location;
  final String district;
  final String state;
  final String country;
  final double? latitude;
  final double? longitude;
  final String? mapEmbedUrl;
  // Social
  final String? facebook;
  final String? instagram;
  final String? linkedin;
  final String? youtube;
  // Gallery
  final List<String> galleryImages;
  final List<String> galleryVideos;
  // Services
  final List<String> services;
  // Verification
  final VerificationStatus verificationStatus;
  final VerificationBadges verificationBadges;
  final bool isActive;
  final bool isFeatured;
  final bool isPremium;
  // Analytics
  final int viewCount;
  final int enquiryCount;
  final double rating;
  final int reviewCount;
  // SEO
  final String? metaTitle;
  final String? metaDescription;
  // Timestamps
  final DateTime createdAt;
  final DateTime updatedAt;

  const Company({
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
    this.location,
    required this.district,
    this.state = 'Tamil Nadu',
    this.country = 'India',
    this.latitude,
    this.longitude,
    this.mapEmbedUrl,
    this.facebook,
    this.instagram,
    this.linkedin,
    this.youtube,
    this.galleryImages = const [],
    this.galleryVideos = const [],
    this.services = const [],
    this.verificationStatus = VerificationStatus.pending,
    this.verificationBadges = const VerificationBadges(),
    this.isActive = true,
    this.isFeatured = false,
    this.isPremium = false,
    this.viewCount = 0,
    this.enquiryCount = 0,
    this.rating = 0,
    this.reviewCount = 0,
    this.metaTitle,
    this.metaDescription,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Company.fromMap(Map<String, dynamic> map, String id) {
    return Company(
      id: id,
      slug: map['slug'] ?? '',
      ownerId: map['ownerId'] ?? '',
      name: map['name'] ?? '',
      logoUrl: map['logoUrl'],
      coverImageUrl: map['coverImageUrl'],
      category: map['category'] ?? '',
      subcategory: map['subcategory'],
      foundedYear: map['foundedYear'],
      companySize: map['companySize'],
      gstNumber: map['gstNumber'],
      registrationNumber: map['registrationNumber'],
      description: map['description'] ?? '',
      phone: map['phone'] ?? '',
      alternatePhone: map['alternatePhone'],
      email: map['email'] ?? '',
      website: map['website'],
      whatsapp: map['whatsapp'],
      address: map['address'] ?? '',
      location: map['location'],
      district: map['district'] ?? '',
      state: map['state'] ?? 'Tamil Nadu',
      country: map['country'] ?? 'India',
      latitude: (map['latitude'] as num?)?.toDouble(),
      longitude: (map['longitude'] as num?)?.toDouble(),
      mapEmbedUrl: map['mapEmbedUrl'],
      facebook: map['facebook'],
      instagram: map['instagram'],
      linkedin: map['linkedin'],
      youtube: map['youtube'],
      galleryImages: toStringList(map['galleryImages']),
      galleryVideos: toStringList(map['galleryVideos']),
      services: toStringList(map['services']),
      verificationStatus: VerificationStatus.fromString(map['verificationStatus']),
      verificationBadges: VerificationBadges.fromMap(map['verificationBadges'] as Map<String, dynamic>?),
      isActive: map['isActive'] ?? true,
      isFeatured: map['isFeatured'] ?? false,
      isPremium: map['isPremium'] ?? false,
      viewCount: map['viewCount'] ?? 0,
      enquiryCount: map['enquiryCount'] ?? 0,
      rating: (map['rating'] as num?)?.toDouble() ?? 0,
      reviewCount: map['reviewCount'] ?? 0,
      metaTitle: map['metaTitle'],
      metaDescription: map['metaDescription'],
      createdAt: toDateTimeRequired(map['createdAt']),
      updatedAt: toDateTimeRequired(map['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'slug': slug,
      'ownerId': ownerId,
      'name': name,
      'logoUrl': logoUrl,
      'coverImageUrl': coverImageUrl,
      'category': category,
      'subcategory': subcategory,
      'foundedYear': foundedYear,
      'companySize': companySize,
      'gstNumber': gstNumber,
      'registrationNumber': registrationNumber,
      'description': description,
      'phone': phone,
      'alternatePhone': alternatePhone,
      'email': email,
      'website': website,
      'whatsapp': whatsapp,
      'address': address,
      'location': location,
      'district': district,
      'state': state,
      'country': country,
      'latitude': latitude,
      'longitude': longitude,
      'galleryImages': galleryImages,
      'galleryVideos': galleryVideos,
      'services': services,
      'verificationStatus': verificationStatus.value,
      'verificationBadges': verificationBadges.toMap(),
      'isActive': isActive,
      'isFeatured': isFeatured,
      'isPremium': isPremium,
      'viewCount': viewCount,
      'enquiryCount': enquiryCount,
      'rating': rating,
      'reviewCount': reviewCount,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}

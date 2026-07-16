import 'package:thenijobs/utils/helpers.dart';

class Service {
  final String id;
  final String providerId;
  final String providerName;
  final String name;
  final String category;
  final String description;
  final String? pricing;
  final String district;
  final String status; // 'active', 'pending', 'paused', 'rejected'
  final List<String> images;
  final double rating;
  final int reviewCount;
  final int enquiryCount;
  final bool isFeatured;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Service({
    required this.id,
    required this.providerId,
    required this.providerName,
    required this.name,
    required this.category,
    required this.description,
    this.pricing,
    required this.district,
    required this.status,
    this.images = const [],
    this.rating = 0.0,
    this.reviewCount = 0,
    this.enquiryCount = 0,
    this.isFeatured = false,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Service.fromMap(Map<String, dynamic> map, String id) {
    return Service(
      id: id,
      providerId: map['providerId'] ?? '',
      providerName: map['providerName'] ?? '',
      name: map['name'] ?? '',
      category: map['category'] ?? '',
      description: map['description'] ?? '',
      pricing: map['pricing'],
      district: map['district'] ?? '',
      status: map['status'] ?? 'pending',
      images: toStringList(map['images']),
      rating: (map['rating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: map['reviewCount'] ?? 0,
      enquiryCount: map['enquiryCount'] ?? 0,
      isFeatured: map['isFeatured'] ?? false,
      createdAt: toDateTimeRequired(map['createdAt']),
      updatedAt: toDateTimeRequired(map['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'providerId': providerId,
      'providerName': providerName,
      'name': name,
      'category': category,
      'description': description,
      'pricing': pricing,
      'district': district,
      'status': status,
      'images': images,
      'rating': rating,
      'reviewCount': reviewCount,
      'enquiryCount': enquiryCount,
      'isFeatured': isFeatured,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}

enum BookingStatus {
  pending('pending'),
  quoted('quoted'),
  confirmed('confirmed'),
  inProgress('in_progress'),
  completed('completed'),
  cancelled('cancelled');

  final String value;
  const BookingStatus(this.value);

  static BookingStatus fromString(String? value) {
    return BookingStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => BookingStatus.pending,
    );
  }
}

class Booking {
  final String id;
  final String serviceProviderId; // companyId
  final String customerId;
  final String customerName;
  final String customerPhone;
  final String? customerEmail;
  final String serviceName;
  final BookingStatus bookingStatus;
  final String scheduledDate; // YYYY-MM-DD
  final String scheduledTime; // HH:MM
  final String customerAddress;
  final String? customerNotes;
  final double? quotedPrice;
  final String? specialRequests;
  final String? preferredPackage;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Booking({
    required this.id,
    required this.serviceProviderId,
    required this.customerId,
    required this.customerName,
    required this.customerPhone,
    this.customerEmail,
    required this.serviceName,
    this.bookingStatus = BookingStatus.pending,
    required this.scheduledDate,
    required this.scheduledTime,
    required this.customerAddress,
    this.customerNotes,
    this.quotedPrice,
    this.specialRequests,
    this.preferredPackage,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Booking.fromMap(Map<String, dynamic> map, String id) {
    return Booking(
      id: id,
      serviceProviderId: map['serviceProviderId'] ?? '',
      customerId: map['customerId'] ?? '',
      customerName: map['customerName'] ?? '',
      customerPhone: map['customerPhone'] ?? '',
      customerEmail: map['customerEmail'],
      serviceName: map['serviceName'] ?? '',
      bookingStatus: BookingStatus.fromString(map['bookingStatus']),
      scheduledDate: map['scheduledDate'] ?? '',
      scheduledTime: map['scheduledTime'] ?? '',
      customerAddress: map['customerAddress'] ?? '',
      customerNotes: map['customerNotes'],
      quotedPrice: (map['quotedPrice'] as num?)?.toDouble(),
      specialRequests: map['specialRequests'],
      preferredPackage: map['preferredPackage'],
      createdAt: toDateTimeRequired(map['createdAt']),
      updatedAt: toDateTimeRequired(map['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'serviceProviderId': serviceProviderId,
      'customerId': customerId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerEmail': customerEmail,
      'serviceName': serviceName,
      'bookingStatus': bookingStatus.value,
      'scheduledDate': scheduledDate,
      'scheduledTime': scheduledTime,
      'customerAddress': customerAddress,
      'customerNotes': customerNotes,
      'quotedPrice': quotedPrice,
      'specialRequests': specialRequests,
      'preferredPackage': preferredPackage,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}

enum RFQStatus {
  pendingQuote('pending_quote'),
  quoted('quoted'),
  accepted('accepted'),
  rejected('rejected'),
  invoiced('invoiced'),
  paid('paid'),
  cancelled('cancelled');

  final String value;
  const RFQStatus(this.value);

  static RFQStatus fromString(String? value) {
    return RFQStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => RFQStatus.pendingQuote,
    );
  }
}

class RFQ {
  final String id;
  final String productId;
  final String productName;
  final String companyId;
  final String customerId;
  final String customerName;
  final String customerPhone;
  final String? customerEmail;
  final String? companyName;
  final int quantity;
  final String? targetDeliveryDate;
  final String? message;
  final RFQStatus status;
  final double? quotedPricePerUnit;
  final double? quotedTaxPercent;
  final double? quotedDiscount;
  final double? quotedTotal;
  final String? paymentTerms;
  final String? notes;
  final String? invoiceNumber;
  final DateTime createdAt;
  final DateTime updatedAt;

  const RFQ({
    required this.id,
    required this.productId,
    required this.productName,
    required this.companyId,
    required this.customerId,
    required this.customerName,
    required this.customerPhone,
    this.customerEmail,
    this.companyName,
    required this.quantity,
    this.targetDeliveryDate,
    this.message,
    this.status = RFQStatus.pendingQuote,
    this.quotedPricePerUnit,
    this.quotedTaxPercent,
    this.quotedDiscount,
    this.quotedTotal,
    this.paymentTerms,
    this.notes,
    this.invoiceNumber,
    required this.createdAt,
    required this.updatedAt,
  });

  factory RFQ.fromMap(Map<String, dynamic> map, String id) {
    return RFQ(
      id: id,
      productId: map['productId'] ?? '',
      productName: map['productName'] ?? '',
      companyId: map['companyId'] ?? '',
      customerId: map['customerId'] ?? '',
      customerName: map['customerName'] ?? '',
      customerPhone: map['customerPhone'] ?? '',
      customerEmail: map['customerEmail'],
      companyName: map['companyName'],
      quantity: map['quantity'] ?? 1,
      targetDeliveryDate: map['targetDeliveryDate'],
      message: map['message'],
      status: RFQStatus.fromString(map['status']),
      quotedPricePerUnit: (map['quotedPricePerUnit'] as num?)?.toDouble(),
      quotedTaxPercent: (map['quotedTaxPercent'] as num?)?.toDouble(),
      quotedDiscount: (map['quotedDiscount'] as num?)?.toDouble(),
      quotedTotal: (map['quotedTotal'] as num?)?.toDouble(),
      paymentTerms: map['paymentTerms'],
      notes: map['notes'],
      invoiceNumber: map['invoiceNumber'],
      createdAt: toDateTimeRequired(map['createdAt']),
      updatedAt: toDateTimeRequired(map['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'productId': productId,
      'productName': productName,
      'companyId': companyId,
      'customerId': customerId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerEmail': customerEmail,
      'companyName': companyName,
      'quantity': quantity,
      'targetDeliveryDate': targetDeliveryDate,
      'message': message,
      'status': status.value,
      'quotedPricePerUnit': quotedPricePerUnit,
      'quotedTaxPercent': quotedTaxPercent,
      'quotedDiscount': quotedDiscount,
      'quotedTotal': quotedTotal,
      'paymentTerms': paymentTerms,
      'notes': notes,
      'invoiceNumber': invoiceNumber,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}

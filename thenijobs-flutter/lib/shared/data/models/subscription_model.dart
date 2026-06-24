import 'package:cloud_firestore/cloud_firestore.dart';

enum SubscriptionPlanSlug {
  free,
  basic,
  premium,
  enterprise;

  static SubscriptionPlanSlug fromString(String value) {
    switch (value) {
      case 'free':
        return SubscriptionPlanSlug.free;
      case 'basic':
        return SubscriptionPlanSlug.basic;
      case 'premium':
        return SubscriptionPlanSlug.premium;
      case 'enterprise':
        return SubscriptionPlanSlug.enterprise;
      default:
        throw ArgumentError('Unknown SubscriptionPlanSlug: $value');
    }
  }

  String toJson() {
    switch (this) {
      case SubscriptionPlanSlug.free:
        return 'free';
      case SubscriptionPlanSlug.basic:
        return 'basic';
      case SubscriptionPlanSlug.premium:
        return 'premium';
      case SubscriptionPlanSlug.enterprise:
        return 'enterprise';
    }
  }
}

enum SubscriptionStatus {
  active,
  expired,
  cancelled,
  trial;

  static SubscriptionStatus fromString(String value) {
    switch (value) {
      case 'active':
        return SubscriptionStatus.active;
      case 'expired':
        return SubscriptionStatus.expired;
      case 'cancelled':
        return SubscriptionStatus.cancelled;
      case 'trial':
        return SubscriptionStatus.trial;
      default:
        throw ArgumentError('Unknown SubscriptionStatus: $value');
    }
  }

  String toJson() {
    switch (this) {
      case SubscriptionStatus.active:
        return 'active';
      case SubscriptionStatus.expired:
        return 'expired';
      case SubscriptionStatus.cancelled:
        return 'cancelled';
      case SubscriptionStatus.trial:
        return 'trial';
    }
  }
}

enum SubscriptionPeriod {
  month,
  year,
  forever;

  static SubscriptionPeriod fromString(String value) {
    switch (value) {
      case 'month':
        return SubscriptionPeriod.month;
      case 'year':
        return SubscriptionPeriod.year;
      case 'forever':
        return SubscriptionPeriod.forever;
      default:
        throw ArgumentError('Unknown SubscriptionPeriod: $value');
    }
  }

  String toJson() {
    switch (this) {
      case SubscriptionPeriod.month:
        return 'month';
      case SubscriptionPeriod.year:
        return 'year';
      case SubscriptionPeriod.forever:
        return 'forever';
    }
  }
}

class Subscription {
  final String id;
  final String userId;
  final String? companyId;
  final SubscriptionPlanSlug plan;
  final SubscriptionStatus status;
  final double amount;
  final DateTime startDate;
  final DateTime endDate;
  final bool autoRenew;
  final String? paymentMethod;
  final DateTime createdAt;

  Subscription({
    required this.id,
    required this.userId,
    this.companyId,
    required this.plan,
    required this.status,
    required this.amount,
    required this.startDate,
    required this.endDate,
    required this.autoRenew,
    this.paymentMethod,
    required this.createdAt,
  });

  factory Subscription.fromFirestore(Map<String, dynamic> data, String id) {
    return Subscription(
      id: id,
      userId: data['userId'] as String? ?? '',
      companyId: data['companyId'] as String?,
      plan: data['plan'] != null
          ? SubscriptionPlanSlug.fromString(data['plan'] as String)
          : SubscriptionPlanSlug.free,
      status: data['status'] != null
          ? SubscriptionStatus.fromString(data['status'] as String)
          : SubscriptionStatus.expired,
      amount: (data['amount'] as num? ?? 0.0).toDouble(),
      startDate: data['startDate'] != null
          ? (data['startDate'] as Timestamp).toDate()
          : DateTime.now(),
      endDate: data['endDate'] != null
          ? (data['endDate'] as Timestamp).toDate()
          : DateTime.now(),
      autoRenew: data['autoRenew'] as bool? ?? false,
      paymentMethod: data['paymentMethod'] as String?,
      createdAt: data['createdAt'] != null
          ? (data['createdAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      if (companyId != null) 'companyId': companyId,
      'plan': plan.toJson(),
      'status': status.toJson(),
      'amount': amount,
      'startDate': Timestamp.fromDate(startDate),
      'endDate': Timestamp.fromDate(endDate),
      'autoRenew': autoRenew,
      if (paymentMethod != null) 'paymentMethod': paymentMethod,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }
}

class SubscriptionPlan {
  final String id;
  final String name;
  final SubscriptionPlanSlug slug;
  final double price;
  final SubscriptionPeriod period;
  final List<String> features;
  final List<String> notIncluded;
  final bool recommended;
  final String bestFor;
  final String icon;

  SubscriptionPlan({
    required this.id,
    required this.name,
    required this.slug,
    required this.price,
    required this.period,
    required this.features,
    required this.notIncluded,
    required this.recommended,
    required this.bestFor,
    required this.icon,
  });

  factory SubscriptionPlan.fromFirestore(Map<String, dynamic> data, String id) {
    return SubscriptionPlan(
      id: id,
      name: data['name'] as String? ?? '',
      slug: data['slug'] != null
          ? SubscriptionPlanSlug.fromString(data['slug'] as String)
          : SubscriptionPlanSlug.free,
      price: (data['price'] as num? ?? 0.0).toDouble(),
      period: data['period'] != null
          ? SubscriptionPeriod.fromString(data['period'] as String)
          : SubscriptionPeriod.month,
      features:
          (data['features'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      notIncluded:
          (data['notIncluded'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      recommended: data['recommended'] as bool? ?? false,
      bestFor: data['bestFor'] as String? ?? '',
      icon: data['icon'] as String? ?? '',
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'name': name,
      'slug': slug.toJson(),
      'price': price,
      'period': period.toJson(),
      'features': features,
      'notIncluded': notIncluded,
      'recommended': recommended,
      'bestFor': bestFor,
      'icon': icon,
    };
  }
}

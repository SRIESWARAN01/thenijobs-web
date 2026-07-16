import 'package:thenijobs/utils/helpers.dart';

enum SubscriptionPlanSlug {
  free('free'),
  basic('basic'),
  premium('premium'),
  enterprise('enterprise');

  final String value;
  const SubscriptionPlanSlug(this.value);

  static SubscriptionPlanSlug fromString(String? value) {
    return SubscriptionPlanSlug.values.firstWhere(
      (e) => e.value == value,
      orElse: () => SubscriptionPlanSlug.free,
    );
  }
}

class Subscription {
  final String id;
  final String userId;
  final String? companyId;
  final SubscriptionPlanSlug plan;
  final String? planName;
  final String? audience; // 'seeker', 'employer', 'business', 'service'
  final String status; // 'active', 'expired', 'pending_renewal', 'cancelled'
  final double amount;
  final DateTime startDate;
  final DateTime endDate;
  final DateTime? paymentDate;
  final String? paymentRequestId;
  final String? userName;
  final String? companyName;
  final String? email;
  final String? mobile;
  final bool autoRenew;
  final String? paymentMethod;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const Subscription({
    required this.id,
    required this.userId,
    this.companyId,
    required this.plan,
    this.planName,
    this.audience,
    required this.status,
    required this.amount,
    required this.startDate,
    required this.endDate,
    this.paymentDate,
    this.paymentRequestId,
    this.userName,
    this.companyName,
    this.email,
    this.mobile,
    this.autoRenew = false,
    this.paymentMethod,
    required this.createdAt,
    this.updatedAt,
  });

  factory Subscription.fromMap(Map<String, dynamic> map, String id) {
    return Subscription(
      id: id,
      userId: map['userId'] ?? '',
      companyId: map['companyId'],
      plan: SubscriptionPlanSlug.fromString(map['plan']),
      planName: map['planName'],
      audience: map['audience'],
      status: map['status'] ?? 'expired',
      amount: (map['amount'] as num?)?.toDouble() ?? 0.0,
      startDate: toDateTimeRequired(map['startDate']),
      endDate: toDateTimeRequired(map['endDate']),
      paymentDate: toDateTime(map['paymentDate']),
      paymentRequestId: map['paymentRequestId'],
      userName: map['userName'],
      companyName: map['companyName'],
      email: map['email'],
      mobile: map['mobile'],
      autoRenew: map['autoRenew'] ?? false,
      paymentMethod: map['paymentMethod'],
      createdAt: toDateTimeRequired(map['createdAt']),
      updatedAt: toDateTime(map['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'companyId': companyId,
      'plan': plan.value,
      'planName': planName,
      'audience': audience,
      'status': status,
      'amount': amount,
      'startDate': startDate,
      'endDate': endDate,
      'paymentDate': paymentDate,
      'paymentRequestId': paymentRequestId,
      'userName': userName,
      'companyName': companyName,
      'email': email,
      'mobile': mobile,
      'autoRenew': autoRenew,
      'paymentMethod': paymentMethod,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}

import 'package:cloud_firestore/cloud_firestore.dart';

enum LeadType {
  candidate,
  business,
  service;

  static LeadType fromString(String value) {
    switch (value) {
      case 'candidate':
        return LeadType.candidate;
      case 'business':
        return LeadType.business;
      case 'service':
        return LeadType.service;
      default:
        throw ArgumentError('Unknown LeadType: $value');
    }
  }

  String toJson() {
    switch (this) {
      case LeadType.candidate:
        return 'candidate';
      case LeadType.business:
        return 'business';
      case LeadType.service:
        return 'service';
    }
  }
}

enum LeadStatus {
  newStatus, // Using newStatus since new is a reserved keyword in Dart (or some versions, but let's avoid 'new' as a field/identifier)
  contacted,
  qualified,
  converted,
  closed,
  lost;

  static LeadStatus fromString(String value) {
    switch (value) {
      case 'new':
        return LeadStatus.newStatus;
      case 'contacted':
        return LeadStatus.contacted;
      case 'qualified':
        return LeadStatus.qualified;
      case 'converted':
        return LeadStatus.converted;
      case 'closed':
        return LeadStatus.closed;
      case 'lost':
        return LeadStatus.lost;
      default:
        throw ArgumentError('Unknown LeadStatus: $value');
    }
  }

  String toJson() {
    switch (this) {
      case LeadStatus.newStatus:
        return 'new';
      case LeadStatus.contacted:
        return 'contacted';
      case LeadStatus.qualified:
        return 'qualified';
      case LeadStatus.converted:
        return 'converted';
      case LeadStatus.closed:
        return 'closed';
      case LeadStatus.lost:
        return 'lost';
    }
  }
}

class Lead {
  final String id;
  final LeadType type;
  final String source;
  final String? companyId;
  final String contactName;
  final String contactPhone;
  final String? contactEmail;
  final String? message;
  final LeadStatus status;
  final String? assignedTo;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  Lead({
    required this.id,
    required this.type,
    required this.source,
    this.companyId,
    required this.contactName,
    required this.contactPhone,
    this.contactEmail,
    this.message,
    required this.status,
    this.assignedTo,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Lead.fromFirestore(Map<String, dynamic> data, String id) {
    return Lead(
      id: id,
      type: data['type'] != null
          ? LeadType.fromString(data['type'] as String)
          : LeadType.candidate,
      source: data['source'] as String? ?? '',
      companyId: data['companyId'] as String?,
      contactName:
          data['contactName'] as String? ??
          data['customerName'] as String? ??
          data['name'] as String? ??
          '',
      contactPhone:
          data['contactPhone'] as String? ??
          data['customerPhone'] as String? ??
          data['phone'] as String? ??
          '',
      contactEmail:
          data['contactEmail'] as String? ??
          data['customerEmail'] as String? ??
          data['email'] as String?,
      message: data['message'] as String?,
      status: data['status'] != null
          ? LeadStatus.fromString(data['status'] as String)
          : LeadStatus.newStatus,
      assignedTo: data['assignedTo'] as String?,
      notes: data['notes'] as String?,
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
      'type': type.toJson(),
      'source': source,
      if (companyId != null) 'companyId': companyId,
      'contactName': contactName,
      'contactPhone': contactPhone,
      if (contactEmail != null) 'contactEmail': contactEmail,
      if (message != null) 'message': message,
      'status': status.toJson(),
      if (assignedTo != null) 'assignedTo': assignedTo,
      if (notes != null) 'notes': notes,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }
}

import 'package:cloud_firestore/cloud_firestore.dart';

enum UserRole {
  jobSeeker,
  employer,
  businessOwner,
  supplier,
  serviceProvider,
  admin,
  superAdmin;

  static UserRole fromString(String value) {
    switch (value) {
      case 'job_seeker':
        return UserRole.jobSeeker;
      case 'employer':
        return UserRole.employer;
      case 'business_owner':
        return UserRole.businessOwner;
      case 'supplier':
        return UserRole.supplier;
      case 'service_provider':
        return UserRole.serviceProvider;
      case 'admin':
        return UserRole.admin;
      case 'super_admin':
        return UserRole.superAdmin;
      default:
        throw ArgumentError('Unknown UserRole: $value');
    }
  }

  String toJson() {
    switch (this) {
      case UserRole.jobSeeker:
        return 'job_seeker';
      case UserRole.employer:
        return 'employer';
      case UserRole.businessOwner:
        return 'business_owner';
      case UserRole.supplier:
        return 'supplier';
      case UserRole.serviceProvider:
        return 'service_provider';
      case UserRole.admin:
        return 'admin';
      case UserRole.superAdmin:
        return 'super_admin';
    }
  }
}

enum AdminRole {
  superAdmin,
  admin,
  moderator,
  supportExecutive,
  salesManager,
  franchiseAdmin;

  static AdminRole fromString(String value) {
    switch (value) {
      case 'super_admin':
        return AdminRole.superAdmin;
      case 'admin':
        return AdminRole.admin;
      case 'moderator':
        return AdminRole.moderator;
      case 'support_executive':
        return AdminRole.supportExecutive;
      case 'sales_manager':
        return AdminRole.salesManager;
      case 'franchise_admin':
        return AdminRole.franchiseAdmin;
      default:
        throw ArgumentError('Unknown AdminRole: $value');
    }
  }

  String toJson() {
    switch (this) {
      case AdminRole.superAdmin:
        return 'super_admin';
      case AdminRole.admin:
        return 'admin';
      case AdminRole.moderator:
        return 'moderator';
      case AdminRole.supportExecutive:
        return 'support_executive';
      case AdminRole.salesManager:
        return 'sales_manager';
      case AdminRole.franchiseAdmin:
        return 'franchise_admin';
    }
  }
}

enum EmployerRole {
  companyOwner,
  hrManager,
  recruiter,
  branchManager,
  staffUser;

  static EmployerRole fromString(String value) {
    switch (value) {
      case 'company_owner':
        return EmployerRole.companyOwner;
      case 'hr_manager':
        return EmployerRole.hrManager;
      case 'recruiter':
        return EmployerRole.recruiter;
      case 'branch_manager':
        return EmployerRole.branchManager;
      case 'staff_user':
        return EmployerRole.staffUser;
      default:
        throw ArgumentError('Unknown EmployerRole: $value');
    }
  }

  String toJson() {
    switch (this) {
      case EmployerRole.companyOwner:
        return 'company_owner';
      case EmployerRole.hrManager:
        return 'hr_manager';
      case EmployerRole.recruiter:
        return 'recruiter';
      case EmployerRole.branchManager:
        return 'branch_manager';
      case EmployerRole.staffUser:
        return 'staff_user';
    }
  }
}

class UserPreferences {
  final bool? openToWork;
  final List<String>? jobTypes;
  final List<String>? locations;
  final double? expectedSalary;

  UserPreferences({
    this.openToWork,
    this.jobTypes,
    this.locations,
    this.expectedSalary,
  });

  factory UserPreferences.fromMap(Map<String, dynamic> map) {
    return UserPreferences(
      openToWork: map['openToWork'] as bool?,
      jobTypes: (map['jobTypes'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      locations: (map['locations'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      expectedSalary: (map['expectedSalary'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (openToWork != null) 'openToWork': openToWork,
      if (jobTypes != null) 'jobTypes': jobTypes,
      if (locations != null) 'locations': locations,
      if (expectedSalary != null) 'expectedSalary': expectedSalary,
    };
  }
}

class User {
  final String uid;
  final String email;
  final String displayName;
  final String? photoURL;
  final String? phone;
  final UserRole role;
  final AdminRole? adminRole;
  final EmployerRole? employerRole;
  final String? companyId;
  final String? district;
  final UserPreferences? preferences;
  final bool isVerified;
  final DateTime? lastLoginAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  User({
    required this.uid,
    required this.email,
    required this.displayName,
    this.photoURL,
    this.phone,
    required this.role,
    this.adminRole,
    this.employerRole,
    this.companyId,
    this.district,
    this.preferences,
    required this.isVerified,
    this.lastLoginAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromFirestore(Map<String, dynamic> data, String id) {
    return User(
      uid: id,
      email: data['email'] as String? ?? '',
      displayName: data['displayName'] as String? ?? '',
      photoURL: data['photoURL'] as String?,
      phone: data['phone'] as String?,
      role: data['role'] != null
          ? UserRole.fromString(data['role'] as String)
          : UserRole.jobSeeker,
      adminRole: data['adminRole'] != null
          ? AdminRole.fromString(data['adminRole'] as String)
          : null,
      employerRole: data['employerRole'] != null
          ? EmployerRole.fromString(data['employerRole'] as String)
          : null,
      companyId: data['companyId'] as String?,
      district: data['district'] as String?,
      preferences: data['preferences'] != null
          ? UserPreferences.fromMap(data['preferences'] as Map<String, dynamic>)
          : null,
      isVerified: data['isVerified'] as bool? ?? false,
      lastLoginAt: data['lastLoginAt'] != null
          ? (data['lastLoginAt'] as Timestamp).toDate()
          : null,
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
      'email': email,
      'displayName': displayName,
      if (photoURL != null) 'photoURL': photoURL,
      if (phone != null) 'phone': phone,
      'role': role.toJson(),
      if (adminRole != null) 'adminRole': adminRole!.toJson(),
      if (employerRole != null) 'employerRole': employerRole!.toJson(),
      if (companyId != null) 'companyId': companyId,
      if (district != null) 'district': district,
      if (preferences != null) 'preferences': preferences!.toMap(),
      'isVerified': isVerified,
      if (lastLoginAt != null) 'lastLoginAt': Timestamp.fromDate(lastLoginAt!),
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }
}

typedef UserModel = User;

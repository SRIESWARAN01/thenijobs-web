import 'package:thenijobs/utils/helpers.dart';

// ===== USER ROLES =====

enum UserRole {
  jobSeeker('job_seeker'),
  business('business'),
  employer('employer'),
  pendingEmployer('pending_employer'),
  businessOwner('business_owner'),
  supplier('supplier'),
  serviceProvider('service_provider'),
  entrepreneur('entrepreneur'),
  admin('admin'),
  superAdmin('super_admin');

  final String value;
  const UserRole(this.value);

  static UserRole fromString(String? value) {
    return UserRole.values.firstWhere(
      (e) => e.value == value,
      orElse: () => UserRole.jobSeeker,
    );
  }

  /// All business-type roles are treated the same at runtime.
  bool get isBusinessRole => [
    UserRole.business, UserRole.employer, UserRole.businessOwner,
    UserRole.supplier, UserRole.serviceProvider, UserRole.entrepreneur,
    UserRole.pendingEmployer,
  ].contains(this);

  bool get isAdminRole => [UserRole.admin, UserRole.superAdmin].contains(this);
}

enum AdminRole {
  superAdmin('super_admin'),
  admin('admin'),
  moderator('moderator'),
  supportExecutive('support_executive'),
  salesManager('sales_manager'),
  franchiseAdmin('franchise_admin');

  final String value;
  const AdminRole(this.value);

  static AdminRole? fromString(String? value) {
    if (value == null) return null;
    return AdminRole.values.firstWhere(
      (e) => e.value == value,
      orElse: () => AdminRole.admin,
    );
  }
}

enum EmployerRole {
  companyOwner('company_owner'),
  hrManager('hr_manager'),
  recruiter('recruiter'),
  branchManager('branch_manager'),
  staffUser('staff_user');

  final String value;
  const EmployerRole(this.value);

  static EmployerRole? fromString(String? value) {
    if (value == null) return null;
    return EmployerRole.values.firstWhere(
      (e) => e.value == value,
      orElse: () => EmployerRole.staffUser,
    );
  }
}

// ===== APP USER =====

class AppUser {
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
  final bool isVerified;
  final bool? employerVerified;
  final bool? companyVerified;
  final bool? emailVerified;
  final bool? setupCompleted;
  final DateTime? lastLoginAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AppUser({
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
    this.isVerified = false,
    this.employerVerified,
    this.companyVerified,
    this.emailVerified,
    this.setupCompleted,
    this.lastLoginAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AppUser.fromMap(Map<String, dynamic> map, String id) {
    return AppUser(
      uid: id,
      email: map['email'] ?? '',
      displayName: map['displayName'] ?? '',
      photoURL: map['photoURL'],
      phone: map['phone'],
      role: UserRole.fromString(map['role']),
      adminRole: AdminRole.fromString(map['adminRole']),
      employerRole: EmployerRole.fromString(map['employerRole']),
      companyId: map['companyId'],
      district: map['district'],
      isVerified: map['isVerified'] ?? false,
      employerVerified: map['employerVerified'],
      companyVerified: map['companyVerified'],
      emailVerified: map['emailVerified'],
      setupCompleted: map['setupCompleted'],
      lastLoginAt: toDateTime(map['lastLoginAt']),
      createdAt: toDateTimeRequired(map['createdAt']),
      updatedAt: toDateTimeRequired(map['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'displayName': displayName,
      'photoURL': photoURL,
      'phone': phone,
      'role': role.value,
      'adminRole': adminRole?.value,
      'employerRole': employerRole?.value,
      'companyId': companyId,
      'district': district,
      'isVerified': isVerified,
      'employerVerified': employerVerified,
      'companyVerified': companyVerified,
      'emailVerified': emailVerified,
      'setupCompleted': setupCompleted,
      'lastLoginAt': lastLoginAt,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  AppUser copyWith({
    String? email,
    String? displayName,
    String? photoURL,
    String? phone,
    UserRole? role,
    AdminRole? adminRole,
    EmployerRole? employerRole,
    String? companyId,
    String? district,
    bool? isVerified,
    bool? employerVerified,
    bool? companyVerified,
    bool? emailVerified,
    bool? setupCompleted,
  }) {
    return AppUser(
      uid: uid,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      photoURL: photoURL ?? this.photoURL,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      adminRole: adminRole ?? this.adminRole,
      employerRole: employerRole ?? this.employerRole,
      companyId: companyId ?? this.companyId,
      district: district ?? this.district,
      isVerified: isVerified ?? this.isVerified,
      employerVerified: employerVerified ?? this.employerVerified,
      companyVerified: companyVerified ?? this.companyVerified,
      emailVerified: emailVerified ?? this.emailVerified,
      setupCompleted: setupCompleted ?? this.setupCompleted,
      lastLoginAt: lastLoginAt,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}

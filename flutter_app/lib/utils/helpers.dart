import 'package:cloud_firestore/cloud_firestore.dart';

/// Converts Firestore Timestamp fields to Dart DateTime.
/// Used by all model fromMap() constructors.
DateTime? toDateTime(dynamic value) {
  if (value == null) return null;
  if (value is Timestamp) return value.toDate();
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  return null;
}

/// Non-nullable version — throws if null.
DateTime toDateTimeRequired(dynamic value) {
  final dt = toDateTime(value);
  if (dt == null) return DateTime.now();
  return dt;
}

/// Converts a list of dynamic to List<String>.
List<String> toStringList(dynamic value) {
  if (value == null) return [];
  if (value is List) return value.map((e) => e.toString()).toList();
  return [];
}

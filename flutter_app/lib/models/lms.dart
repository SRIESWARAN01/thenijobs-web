import 'package:thenijobs/utils/helpers.dart';

enum CourseDifficulty {
  beginner('beginner'),
  intermediate('intermediate'),
  advanced('advanced');

  final String value;
  const CourseDifficulty(this.value);

  static CourseDifficulty fromString(String? value) {
    return CourseDifficulty.values.firstWhere(
      (e) => e.value == value,
      orElse: () => CourseDifficulty.beginner,
    );
  }
}

class Course {
  final String id;
  final String title;
  final String description;
  final String category;
  final String thumbnail;
  final CourseDifficulty difficulty;
  final int totalModules;
  final int totalLessons;
  final int estimatedHours;
  final List<String> skills;
  final List<String> prerequisites;
  final String? certificateTemplateId;
  final bool isPublished;
  final bool isFeatured;
  final int enrollmentCount;
  final int completionCount;
  final double avgRating;
  final String createdBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Course({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.thumbnail,
    required this.difficulty,
    this.totalModules = 0,
    this.totalLessons = 0,
    this.estimatedHours = 0,
    this.skills = const [],
    this.prerequisites = const [],
    this.certificateTemplateId,
    this.isPublished = false,
    this.isFeatured = false,
    this.enrollmentCount = 0,
    this.completionCount = 0,
    this.avgRating = 0.0,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Course.fromMap(Map<String, dynamic> map, String id) {
    return Course(
      id: id,
      title: map['title'] ?? '',
      description: map['description'] ?? '',
      category: map['category'] ?? '',
      thumbnail: map['thumbnail'] ?? '',
      difficulty: CourseDifficulty.fromString(map['difficulty']),
      totalModules: map['totalModules'] ?? 0,
      totalLessons: map['totalLessons'] ?? 0,
      estimatedHours: map['estimatedHours'] ?? 0,
      skills: toStringList(map['skills']),
      prerequisites: toStringList(map['prerequisites']),
      certificateTemplateId: map['certificateTemplateId'],
      isPublished: map['isPublished'] ?? false,
      isFeatured: map['isFeatured'] ?? false,
      enrollmentCount: map['enrollmentCount'] ?? 0,
      completionCount: map['completionCount'] ?? 0,
      avgRating: (map['avgRating'] as num?)?.toDouble() ?? 0.0,
      createdBy: map['createdBy'] ?? '',
      createdAt: toDateTimeRequired(map['createdAt']),
      updatedAt: toDateTimeRequired(map['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'description': description,
      'category': category,
      'thumbnail': thumbnail,
      'difficulty': difficulty.value,
      'totalModules': totalModules,
      'totalLessons': totalLessons,
      'estimatedHours': estimatedHours,
      'skills': skills,
      'prerequisites': prerequisites,
      'certificateTemplateId': certificateTemplateId,
      'isPublished': isPublished,
      'isFeatured': isFeatured,
      'enrollmentCount': enrollmentCount,
      'completionCount': completionCount,
      'avgRating': avgRating,
      'createdBy': createdBy,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}

class CourseModule {
  final String id;
  final String courseId;
  final String title;
  final String description;
  final int order;
  final String? quizId;
  final int lessonsCount;
  final DateTime createdAt;

  const CourseModule({
    required this.id,
    required this.courseId,
    required this.title,
    required this.description,
    required this.order,
    this.quizId,
    this.lessonsCount = 0,
    required this.createdAt,
  });

  factory CourseModule.fromMap(Map<String, dynamic> map, String id) {
    return CourseModule(
      id: id,
      courseId: map['courseId'] ?? '',
      title: map['title'] ?? '',
      description: map['description'] ?? '',
      order: map['order'] ?? 0,
      quizId: map['quizId'],
      lessonsCount: map['lessonsCount'] ?? 0,
      createdAt: toDateTimeRequired(map['createdAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'courseId': courseId,
      'title': title,
      'description': description,
      'order': order,
      'quizId': quizId,
      'lessonsCount': lessonsCount,
      'createdAt': createdAt,
    };
  }
}

enum LessonType {
  video('video'),
  text('text'),
  quiz('quiz');

  final String value;
  const LessonType(this.value);

  static LessonType fromString(String? value) {
    return LessonType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => LessonType.text,
    );
  }
}

class Lesson {
  final String id;
  final String courseId;
  final String moduleId;
  final String title;
  final String description;
  final LessonType type;
  final String? videoUrl; // If type is video
  final String? content; // If type is text (markdown)
  final String? quizId; // If type is quiz
  final int durationMinutes;
  final int order;
  final DateTime createdAt;

  const Lesson({
    required this.id,
    required this.courseId,
    required this.moduleId,
    required this.title,
    required this.description,
    required this.type,
    this.videoUrl,
    this.content,
    this.quizId,
    this.durationMinutes = 0,
    required this.order,
    required this.createdAt,
  });

  factory Lesson.fromMap(Map<String, dynamic> map, String id) {
    return Lesson(
      id: id,
      courseId: map['courseId'] ?? '',
      moduleId: map['moduleId'] ?? '',
      title: map['title'] ?? '',
      description: map['description'] ?? '',
      type: LessonType.fromString(map['type']),
      videoUrl: map['videoUrl'],
      content: map['content'],
      quizId: map['quizId'],
      durationMinutes: map['durationMinutes'] ?? 0,
      order: map['order'] ?? 0,
      createdAt: toDateTimeRequired(map['createdAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'courseId': courseId,
      'moduleId': moduleId,
      'title': title,
      'description': description,
      'type': type.value,
      'videoUrl': videoUrl,
      'content': content,
      'quizId': quizId,
      'durationMinutes': durationMinutes,
      'order': order,
      'createdAt': createdAt,
    };
  }
}

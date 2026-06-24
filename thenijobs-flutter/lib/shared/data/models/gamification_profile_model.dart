import 'package:cloud_firestore/cloud_firestore.dart';

class RewardsPoints {
  final int current;
  final int total;
  final int monthlyPoints;
  final DateTime monthStartDate;
  final DateTime? lastEarnedAt;

  RewardsPoints({
    required this.current,
    required this.total,
    required this.monthlyPoints,
    required this.monthStartDate,
    this.lastEarnedAt,
  });

  factory RewardsPoints.fromMap(Map<String, dynamic> data) {
    return RewardsPoints(
      current: (data['current'] as num? ?? 0).toInt(),
      total: (data['total'] as num? ?? 0).toInt(),
      monthlyPoints: (data['monthlyPoints'] as num? ?? 0).toInt(),
      monthStartDate: data['monthStartDate'] != null
          ? (data['monthStartDate'] as Timestamp).toDate()
          : DateTime.now(),
      lastEarnedAt: data['lastEarnedAt'] != null
          ? (data['lastEarnedAt'] as Timestamp).toDate()
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'current': current,
      'total': total,
      'monthlyPoints': monthlyPoints,
      'monthStartDate': Timestamp.fromDate(monthStartDate),
      if (lastEarnedAt != null)
        'lastEarnedAt': Timestamp.fromDate(lastEarnedAt!),
    };
  }
}

class Badge {
  final String id;
  final String name;
  final String icon;
  final String description;
  final DateTime earnedAt;
  final bool displayOnProfile;

  Badge({
    required this.id,
    required this.name,
    required this.icon,
    required this.description,
    required this.earnedAt,
    required this.displayOnProfile,
  });

  factory Badge.fromMap(Map<String, dynamic> data) {
    return Badge(
      id: data['id'] as String? ?? '',
      name: data['name'] as String? ?? '',
      icon: data['icon'] as String? ?? '',
      description: data['description'] as String? ?? '',
      earnedAt: data['earnedAt'] != null
          ? (data['earnedAt'] as Timestamp).toDate()
          : DateTime.now(),
      displayOnProfile: data['displayOnProfile'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'icon': icon,
      'description': description,
      'earnedAt': Timestamp.fromDate(earnedAt),
      'displayOnProfile': displayOnProfile,
    };
  }
}

class Achievement {
  final String id;
  final String name;
  final String icon;
  final String description;
  final String requirement;
  final int progress;
  final int maxProgress;
  final bool completed;
  final DateTime? earnedAt;

  Achievement({
    required this.id,
    required this.name,
    required this.icon,
    required this.description,
    required this.requirement,
    required this.progress,
    required this.maxProgress,
    required this.completed,
    this.earnedAt,
  });

  factory Achievement.fromMap(Map<String, dynamic> data) {
    return Achievement(
      id: data['id'] as String? ?? '',
      name: data['name'] as String? ?? '',
      icon: data['icon'] as String? ?? '',
      description: data['description'] as String? ?? '',
      requirement: data['requirement'] as String? ?? '',
      progress: (data['progress'] as num? ?? 0).toInt(),
      maxProgress: (data['maxProgress'] as num? ?? 0).toInt(),
      completed: data['completed'] as bool? ?? false,
      earnedAt: data['earnedAt'] != null
          ? (data['earnedAt'] as Timestamp).toDate()
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'icon': icon,
      'description': description,
      'requirement': requirement,
      'progress': progress,
      'maxProgress': maxProgress,
      'completed': completed,
      if (earnedAt != null) 'earnedAt': Timestamp.fromDate(earnedAt!),
    };
  }
}

class PointActivity {
  final String id;
  final String type;
  final int points;
  final String description;
  final DateTime earnedAt;

  PointActivity({
    required this.id,
    required this.type,
    required this.points,
    required this.description,
    required this.earnedAt,
  });

  factory PointActivity.fromMap(Map<String, dynamic> data) {
    return PointActivity(
      id: data['id'] as String? ?? '',
      type: data['type'] as String? ?? '',
      points: (data['points'] as num? ?? 0).toInt(),
      description: data['description'] as String? ?? '',
      earnedAt: data['earnedAt'] != null
          ? (data['earnedAt'] as Timestamp).toDate()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'type': type,
      'points': points,
      'description': description,
      'earnedAt': Timestamp.fromDate(earnedAt),
    };
  }
}

class GamificationProfile {
  final String uid;
  final RewardsPoints rewards;
  final List<Badge> badges;
  final List<Achievement> achievements;
  final List<PointActivity> recentActivities;
  final int? leaderboardRank;

  GamificationProfile({
    required this.uid,
    required this.rewards,
    required this.badges,
    required this.achievements,
    required this.recentActivities,
    this.leaderboardRank,
  });

  factory GamificationProfile.fromFirestore(
    Map<String, dynamic> data,
    String id,
  ) {
    return GamificationProfile(
      uid: id,
      rewards: data['rewards'] != null
          ? RewardsPoints.fromMap(data['rewards'] as Map<String, dynamic>)
          : RewardsPoints(
              current: 0,
              total: 0,
              monthlyPoints: 0,
              monthStartDate: DateTime.now(),
            ),
      badges:
          (data['badges'] as List<dynamic>?)
              ?.map((e) => Badge.fromMap(e as Map<String, dynamic>))
              .toList() ??
          [],
      achievements:
          (data['achievements'] as List<dynamic>?)
              ?.map((e) => Achievement.fromMap(e as Map<String, dynamic>))
              .toList() ??
          [],
      recentActivities:
          (data['recentActivities'] as List<dynamic>?)
              ?.map((e) => PointActivity.fromMap(e as Map<String, dynamic>))
              .toList() ??
          [],
      leaderboardRank: (data['leaderboardRank'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'rewards': rewards.toMap(),
      'badges': badges.map((e) => e.toMap()).toList(),
      'achievements': achievements.map((e) => e.toMap()).toList(),
      'recentActivities': recentActivities.map((e) => e.toMap()).toList(),
      if (leaderboardRank != null) 'leaderboardRank': leaderboardRank,
    };
  }
}

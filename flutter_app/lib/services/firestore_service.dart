import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:thenijobs/models/job.dart';
import 'package:thenijobs/models/company.dart';
import 'package:thenijobs/models/seeker.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // ===== JOBS =====

  Stream<List<Job>> streamJobs({
    String? category,
    String? district,
    String? jobType,
  }) {
    Query query = _db.collection('jobs').where('isActive', isEqualTo: true);

    if (category != null && category.isNotEmpty) {
      query = query.where('category', isEqualTo: category);
    }
    if (district != null && district.isNotEmpty) {
      query = query.where('district', isEqualTo: district);
    }
    if (jobType != null && jobType.isNotEmpty) {
      query = query.where('jobType', isEqualTo: jobType);
    }

    // Default sorting by posted date
    query = query.orderBy('createdAt', descending: true);

    return query.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return Job.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }).toList();
    });
  }

  Future<Job?> getJobById(String id) async {
    final doc = await _db.collection('jobs').doc(id).get();
    if (!doc.exists) return null;
    return Job.fromMap(doc.data()!, doc.id);
  }

  Future<void> createJob(Job job) async {
    await _db.collection('jobs').doc(job.id).set(job.toMap());
  }

  Future<void> updateJob(String id, Map<String, dynamic> data) async {
    await _db.collection('jobs').doc(id).update(data);
  }

  // ===== COMPANIES =====

  Future<Company?> getCompanyById(String id) async {
    final doc = await _db.collection('companies').doc(id).get();
    if (!doc.exists) return null;
    return Company.fromMap(doc.data()!, doc.id);
  }

  Future<void> saveCompanyProfile(Company company) async {
    await _db.collection('companies').doc(company.id).set(company.toMap());
  }

  // ===== SEEKER PROFILES =====

  Future<JobSeekerProfile?> getSeekerProfile(String uid) async {
    final doc = await _db.collection('seekerProfiles').doc(uid).get();
    if (!doc.exists) return null;
    return JobSeekerProfile.fromMap(doc.data()!, doc.id);
  }

  Future<void> saveSeekerProfile(JobSeekerProfile profile) async {
    await _db.collection('seekerProfiles').doc(profile.uid).set(profile.toMap());
  }

  // ===== APPLICATIONS =====

  Future<void> submitApplication(JobApplication application) async {
    await _db.collection('applications').doc(application.id).set(application.toMap());
  }

  Stream<List<JobApplication>> streamSeekerApplications(String seekerId) {
    return _db
        .collection('applications')
        .where('seekerId', isEqualTo: seekerId)
        .orderBy('appliedAt', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return JobApplication.fromMap(doc.data(), doc.id);
      }).toList();
    });
  }
}

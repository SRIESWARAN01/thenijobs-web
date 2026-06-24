import 'dart:io';

import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart';

class UploadResult {
  const UploadResult({required this.url, required this.path});

  final String url;
  final String path;
}

class StorageService {
  StorageService({FirebaseStorage? storage})
    : _storage = storage ?? FirebaseStorage.instance;

  final FirebaseStorage _storage;

  Future<UploadResult> uploadFile({
    required String path,
    required Object file,
    Set<String>? allowedExtensions,
    int maxBytes = 5 * 1024 * 1024,
  }) async {
    final ref = _storage.ref(path);
    UploadTask task;
    if (file is Uint8List) {
      if (file.length > maxBytes) throw Exception('File exceeds size limit');
      task = ref.putData(file);
    } else if (file is File) {
      final length = await file.length();
      if (length > maxBytes) throw Exception('File exceeds size limit');
      task = ref.putFile(file);
    } else {
      throw Exception('Unsupported upload object');
    }
    await task;
    final url = await ref.getDownloadURL();
    return UploadResult(url: url, path: path);
  }

  Future<void> deleteFile(String path) async {
    await _storage.ref(path).delete();
  }
}

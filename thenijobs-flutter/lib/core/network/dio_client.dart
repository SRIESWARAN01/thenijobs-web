import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';

class DioClient {
  DioClient({FirebaseAuth? auth})
    : _auth = auth ?? FirebaseAuth.instance,
      dio = Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          sendTimeout: const Duration(seconds: 10),
        ),
      ) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _auth.currentUser?.getIdToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final statusCode = error.response?.statusCode;
          final alreadyRetried = error.requestOptions.extra['tokenRetried'] == true;
          if (statusCode == 401 && !alreadyRetried && _auth.currentUser != null) {
            try {
              final token = await _auth.currentUser!.getIdToken(true);
              if (token == null) {
                handler.next(error);
                return;
              }
              final request = error.requestOptions;
              request.extra['tokenRetried'] = true;
              request.headers['Authorization'] = 'Bearer $token';
              final response = await dio.fetch<dynamic>(request);
              handler.resolve(response);
              return;
            } catch (_) {
              // Fall through to the original auth error.
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  final FirebaseAuth _auth;
  final Dio dio;
}

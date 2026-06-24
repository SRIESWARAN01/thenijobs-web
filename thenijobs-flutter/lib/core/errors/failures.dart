// ============================================================
// THENIJOBS — Failure Classes for Clean Architecture
// ============================================================

abstract class Failure {
  final String message;
  const Failure(this.message);

  @override
  String toString() => message;
}

class ServerFailure extends Failure {
  const ServerFailure([
    super.message = 'A server error occurred. Please try again.',
  ]);
}

class AuthFailure extends Failure {
  const AuthFailure([
    super.message = 'Authentication failed. Please check your credentials.',
  ]);
}

class CacheFailure extends Failure {
  const CacheFailure([super.message = 'Failed to load local cached data.']);
}

class NetworkFailure extends Failure {
  const NetworkFailure([
    super.message =
        'No internet connection detected. Please connect and retry.',
  ]);
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}

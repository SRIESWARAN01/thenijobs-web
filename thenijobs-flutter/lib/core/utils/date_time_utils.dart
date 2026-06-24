import 'package:intl/intl.dart';

class DateTimeUtils {
  const DateTimeUtils._();

  static final _short = DateFormat('dd MMM yyyy');
  static final _dateTime = DateFormat('dd MMM yyyy, hh:mm a');

  static String short(DateTime? value) =>
      value == null ? 'Recent' : _short.format(value);

  static String dateTime(DateTime? value) =>
      value == null ? 'Recent' : _dateTime.format(value);

  static String timeAgo(DateTime? value) {
    if (value == null) return 'Just now';
    final diff = DateTime.now().difference(value);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return short(value);
  }
}

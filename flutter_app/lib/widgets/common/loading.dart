import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:thenijobs/config/theme.dart';

class AppLoadingIndicator extends StatelessWidget {
  final double size;
  final Color? color;
  const AppLoadingIndicator({super.key, this.size = 24, this.color});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizedBox(
        width: size,
        height: size,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation<Color>(
            color ?? Theme.of(context).colorScheme.primary,
          ),
        ),
      ),
    );
  }
}

class CardShimmer extends StatelessWidget {
  final double height;
  const CardShimmer({super.key, this.height = 120});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? Colors.grey[800]! : Colors.grey[300]!,
      highlightColor: isDark ? Colors.grey[700]! : Colors.grey[100]!,
      child: Container(
        height: height,
        margin: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
      ),
    );
  }
}

class ListShimmer extends StatelessWidget {
  final int count;
  final double height;
  const ListShimmer({super.key, this.count = 5, this.height = 100});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: count,
      itemBuilder: (context, index) => CardShimmer(height: height),
    );
  }
}

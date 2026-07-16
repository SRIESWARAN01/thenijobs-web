import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';

class ShopHomeScreen extends ConsumerStatefulWidget {
  const ShopHomeScreen({super.key});

  @override
  ConsumerState<ShopHomeScreen> createState() => _ShopHomeScreenState();
}

class _ShopHomeScreenState extends ConsumerState<ShopHomeScreen> {
  int _selectedCategory = 0;
  final _categories = ['All', 'Handloom', 'Food', 'Accessories', 'Organic', 'Electronics'];

  final _mockProducts = [
    _MockProduct('Handloom Cotton Saree', 'Textiles', 1200, 4.5, 'assets/images/product1.png'),
    _MockProduct('Organic Cardamom Pack', 'Spices', 450, 4.8, 'assets/images/product2.png'),
    _MockProduct('Silk Thread Bangles', 'Accessories', 350, 4.2, 'assets/images/product3.png'),
    _MockProduct('Fresh Cumbum Grapes', 'Fruits', 280, 4.6, 'assets/images/product4.png'),
    _MockProduct('Theni Honey Bottle', 'Organic', 520, 4.7, 'assets/images/product5.png'),
    _MockProduct('Bamboo Craft Set', 'Handicrafts', 780, 4.3, 'assets/images/product6.png'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 42, height: 42,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new_rounded, size: 16),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('THENIJOBS', style: GoogleFonts.outfit(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                      Text('Store', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700)),
                    ],
                  ),
                  const Spacer(),
                  _iconBtn(Icons.search_rounded, () {}),
                  const SizedBox(width: 8),
                  Stack(
                    children: [
                      _iconBtn(Icons.shopping_cart_outlined, () => context.push('/shop/cart')),
                      Positioned(
                        right: 0, top: 0,
                        child: Container(
                          width: 18, height: 18,
                          decoration: const BoxDecoration(
                            color: AppColors.accent,
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text('2', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.white)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Category Chips
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: _categories.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final isActive = _selectedCategory == i;
                  return GestureDetector(
                    onTap: () {
                      setState(() => _selectedCategory = i);
                      HapticFeedback.lightImpact();
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      decoration: BoxDecoration(
                        color: isActive ? AppColors.primary : AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: isActive ? AppColors.primary : AppColors.border),
                        boxShadow: isActive
                            ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.25), blurRadius: 8, offset: const Offset(0, 3))]
                            : null,
                      ),
                      child: Center(
                        child: Text(
                          _categories[i],
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                            color: isActive ? Colors.white : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 18),

            // Product Grid
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 14,
                  mainAxisSpacing: 14,
                  childAspectRatio: 0.68,
                ),
                itemCount: _mockProducts.length,
                itemBuilder: (_, i) => _buildProductCard(_mockProducts[i]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(_MockProduct product) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image Area
          Expanded(
            flex: 3,
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
              ),
              child: Stack(
                children: [
                  Center(
                    child: Icon(Icons.shopping_bag_rounded, size: 40, color: AppColors.primary.withValues(alpha: 0.2)),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.9),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.favorite_border_rounded, size: 16, color: AppColors.error),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Info Area
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.name, style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text(product.category, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textTertiary)),
                  const Spacer(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '₹${product.price.toStringAsFixed(0)}',
                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.primary),
                      ),
                      Container(
                        width: 32, height: 32,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [AppColors.accentDark, AppColors.accent]),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.add_rounded, color: Colors.white, size: 18),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _iconBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 42, height: 42,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Icon(icon, size: 20, color: AppColors.textSecondary),
      ),
    );
  }
}

class _MockProduct {
  final String name, category, imagePath;
  final double price, rating;
  _MockProduct(this.name, this.category, this.price, this.rating, this.imagePath);
}

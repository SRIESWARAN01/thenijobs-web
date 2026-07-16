import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mockItems = [
      _MockCartItem('Handloom Cotton Saree', 'Textiles', 1200, 1),
      _MockCartItem('Organic Cardamom Pack', 'Spices', 450, 2),
    ];
    final subtotal = mockItems.fold<double>(0, (sum, item) => sum + item.price * item.qty);
    final delivery = 49.0;
    final total = subtotal + delivery;

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
                  Text('My Cart', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w700)),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primarySurface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${mockItems.length} items',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Cart Items
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: mockItems.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) {
                  final item = mockItems[i];
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        // Product Image Placeholder
                        Container(
                          width: 72, height: 72,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(Icons.shopping_bag_rounded, size: 28, color: AppColors.primary.withValues(alpha: 0.2)),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.name, style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700)),
                              const SizedBox(height: 3),
                              Text(item.category, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textTertiary)),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Text(
                                    '₹${item.price.toStringAsFixed(0)}',
                                    style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.primary),
                                  ),
                                  const Spacer(),
                                  Container(
                                    decoration: BoxDecoration(
                                      color: AppColors.surfaceVariant,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Row(
                                      children: [
                                        _qtyBtn(Icons.remove, () {}),
                                        Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 12),
                                          child: Text('${item.qty}', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700)),
                                        ),
                                        _qtyBtn(Icons.add, () {}),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

            // Bottom Summary
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, -4)),
                ],
              ),
              child: Column(
                children: [
                  _summaryRow('Subtotal', '₹${subtotal.toStringAsFixed(0)}'),
                  const SizedBox(height: 8),
                  _summaryRow('Delivery', '₹${delivery.toStringAsFixed(0)}'),
                  const SizedBox(height: 12),
                  Container(height: 1, color: AppColors.border),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Total', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700)),
                      Text('₹${total.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.primary)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Container(
                    width: double.infinity,
                    height: 54,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [AppColors.accentDark, AppColors.accent]),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: AppColors.accent.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 6))],
                    ),
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.payment_rounded, color: Colors.white, size: 20),
                          const SizedBox(width: 10),
                          Text('Proceed to Checkout', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
        Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _qtyBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32, height: 32,
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, size: 16, color: AppColors.textSecondary),
      ),
    );
  }
}

class _MockCartItem {
  final String name, category;
  final double price;
  final int qty;
  _MockCartItem(this.name, this.category, this.price, this.qty);
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/config/constants.dart';
import 'package:thenijobs/models/ecommerce.dart';
import 'package:thenijobs/widgets/cards/product_card.dart';

final shopProductsProvider = StreamProvider<List<Product>>((ref) {
  // Stub Stream representing shop products from Firestore
  return Stream.value([
    Product(
      id: 'p1',
      name: 'Handloom Cotton Saree',
      description: 'Traditional organic handloom cotton saree woven in Theni.',
      price: 1200.0,
      stock: 10,
      category: 'Clothing & Textiles',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
    Product(
      id: 'p2',
      name: 'Organic Cardamom Pack',
      description: 'Premium aromatic cardamom harvested fresh from Western Ghats.',
      price: 450.0,
      stock: 30,
      category: 'Food & Beverages',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    ),
  ]);
});

class ShopHomeScreen extends ConsumerWidget {
  const ShopHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsState = ref.watch(shopProductsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('THENIJOBS Store'),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart),
            onPressed: () => context.push('/shop/cart'),
          ),
        ],
      ),
      body: SafeArea(
        child: productsState.when(
          data: (products) {
            return GridView.builder(
              padding: const EdgeInsets.all(AppSpacing.base),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.75,
              ),
              itemCount: products.length,
              itemBuilder: (context, index) {
                final product = products[index];
                return ProductCard(
                  product: product,
                  onTap: () {
                    context.push('/shop/product/${product.id}', extra: product);
                  },
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
      ),
    );
  }
}

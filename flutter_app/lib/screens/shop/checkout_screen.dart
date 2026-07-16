import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _addressController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _pay() {
    if (!_formKey.currentState!.validate()) return;

    // Razorpay Integration Mock
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          title: const Text('Razorpay Payment'),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: AppSpacing.md),
              Text('Connecting to Razorpay gateway...'),
            ],
          ),
        );
      },
    );

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        Navigator.pop(context); // Pop Razorpay dialog
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Payment Successful'),
            content: const Text('Your order has been placed successfully!'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context); // Pop success dialog
                  context.go('/seeker/dashboard');
                },
                child: const Text('Back to Home'),
              ),
            ],
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.base),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Shipping Information',
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _addressController,
                  decoration: const InputDecoration(labelText: 'Delivery Address'),
                  maxLines: 3,
                  validator: (val) => val == null || val.isEmpty ? 'Enter address' : null,
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _phoneController,
                  decoration: const InputDecoration(labelText: 'Contact Phone Number'),
                  keyboardType: TextInputType.phone,
                  validator: (val) => val == null || val.length != 10 ? 'Enter valid phone' : null,
                ),
                const SizedBox(height: AppSpacing.xl),
                Text(
                  'Order Summary',
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(AppSpacing.base),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Handloom Cotton Saree x 1'),
                            Text('₹1,200'),
                          ],
                        ),
                        Divider(),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Total Amount:', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text('₹1,200', style: TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xxl),
                ElevatedButton(
                  onPressed: _pay,
                  child: const Text('Pay with Razorpay (₹1,200)'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

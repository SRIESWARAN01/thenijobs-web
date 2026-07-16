import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:thenijobs/config/theme.dart';
import 'package:thenijobs/models/service.dart';

class BookingScreen extends StatefulWidget {
  final Service? service;
  const BookingScreen({super.key, this.service});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final _addressController = TextEditingController();
  final _notesController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _addressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Booking Confirmed'),
        content: const Text('Your appointment has been successfully scheduled!'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Pop dialog
              context.go('/seeker/dashboard');
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Appointment'),
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
                  'Service: ${widget.service?.name ?? "Provider Service"}',
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                TextFormField(
                  controller: _addressController,
                  decoration: const InputDecoration(labelText: 'Service Venue Address'),
                  maxLines: 3,
                  validator: (val) => val == null || val.isEmpty ? 'Enter address' : null,
                ),
                const SizedBox(height: AppSpacing.md),
                TextFormField(
                  controller: _notesController,
                  decoration: const InputDecoration(labelText: 'Special Instructions (Optional)'),
                  maxLines: 2,
                ),
                const SizedBox(height: AppSpacing.xl),
                ElevatedButton(
                  onPressed: _submit,
                  child: const Text('Confirm & Schedule'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

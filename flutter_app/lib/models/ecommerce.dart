import 'package:thenijobs/utils/helpers.dart';

class Product {
  final String id;
  final String? companyId;
  final String name;
  final String description;
  final double price;
  final double? originalPrice;
  final int stock;
  final String category;
  final List<String> images;
  final bool isActive;
  final bool isFeatured;
  final double rating;
  final int reviewCount;
  final List<String> tags;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Product({
    required this.id,
    this.companyId,
    required this.name,
    required this.description,
    required this.price,
    this.originalPrice,
    required this.stock,
    required this.category,
    this.images = const [],
    this.isActive = true,
    this.isFeatured = false,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.tags = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory Product.fromMap(Map<String, dynamic> map, String id) {
    return Product(
      id: id,
      companyId: map['companyId'],
      name: map['name'] ?? '',
      description: map['description'] ?? '',
      price: (map['price'] as num?)?.toDouble() ?? 0.0,
      originalPrice: (map['originalPrice'] as num?)?.toDouble(),
      stock: map['stock'] ?? 0,
      category: map['category'] ?? '',
      images: toStringList(map['images']),
      isActive: map['isActive'] ?? true,
      isFeatured: map['isFeatured'] ?? false,
      rating: (map['rating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: map['reviewCount'] ?? 0,
      tags: toStringList(map['tags']),
      createdAt: toDateTimeRequired(map['createdAt']),
      updatedAt: toDateTimeRequired(map['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'companyId': companyId,
      'name': name,
      'description': description,
      'price': price,
      'originalPrice': originalPrice,
      'stock': stock,
      'category': category,
      'images': images,
      'isActive': isActive,
      'isFeatured': isFeatured,
      'rating': rating,
      'reviewCount': reviewCount,
      'tags': tags,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}

class OrderItem {
  final String productId;
  final String name;
  final double price;
  final int quantity;
  final String? image;

  const OrderItem({
    required this.productId,
    required this.name,
    required this.price,
    required this.quantity,
    this.image,
  });

  factory OrderItem.fromMap(Map<String, dynamic> map) {
    return OrderItem(
      productId: map['productId'] ?? '',
      name: map['name'] ?? '',
      price: (map['price'] as num?)?.toDouble() ?? 0.0,
      quantity: map['quantity'] ?? 1,
      image: map['image'],
    );
  }

  Map<String, dynamic> toMap() => {
        'productId': productId,
        'name': name,
        'price': price,
        'quantity': quantity,
        'image': image,
      };
}

enum OrderStatus {
  pending('pending'),
  processing('processing'),
  shipped('shipped'),
  delivered('delivered'),
  cancelled('cancelled');

  final String value;
  const OrderStatus(this.value);

  static OrderStatus fromString(String? value) {
    return OrderStatus.values.firstWhere(
      (e) => e.value == value,
      orElse: () => OrderStatus.pending,
    );
  }
}

class Order {
  final String id;
  final String customerId;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  final String customerAddress;
  final List<OrderItem> items;
  final double subtotal;
  final String? couponCode;
  final double discountAmount;
  final double totalAmount;
  final OrderStatus status;
  final bool whatsappSent;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Order({
    required this.id,
    required this.customerId,
    required this.customerName,
    required this.customerEmail,
    required this.customerPhone,
    required this.customerAddress,
    this.items = const [],
    required this.subtotal,
    this.couponCode,
    this.discountAmount = 0.0,
    required this.totalAmount,
    this.status = OrderStatus.pending,
    this.whatsappSent = false,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Order.fromMap(Map<String, dynamic> map, String id) {
    return Order(
      id: id,
      customerId: map['customerId'] ?? '',
      customerName: map['customerName'] ?? '',
      customerEmail: map['customerEmail'] ?? '',
      customerPhone: map['customerPhone'] ?? '',
      customerAddress: map['customerAddress'] ?? '',
      items: (map['items'] as List? ?? [])
          .map((x) => OrderItem.fromMap(Map<String, dynamic>.from(x)))
          .toList(),
      subtotal: (map['subtotal'] as num?)?.toDouble() ?? 0.0,
      couponCode: map['couponCode'],
      discountAmount: (map['discountAmount'] as num?)?.toDouble() ?? 0.0,
      totalAmount: (map['totalAmount'] as num?)?.toDouble() ?? 0.0,
      status: OrderStatus.fromString(map['status']),
      whatsappSent: map['whatsappSent'] ?? false,
      notes: map['notes'],
      createdAt: toDateTimeRequired(map['createdAt']),
      updatedAt: toDateTimeRequired(map['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'customerId': customerId,
      'customerName': customerName,
      'customerEmail': customerEmail,
      'customerPhone': customerPhone,
      'customerAddress': customerAddress,
      'items': items.map((x) => x.toMap()).toList(),
      'subtotal': subtotal,
      'couponCode': couponCode,
      'discountAmount': discountAmount,
      'totalAmount': totalAmount,
      'status': status.value,
      'whatsappSent': whatsappSent,
      'notes': notes,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}

class CartItem {
  final String productId;
  final String name;
  final double price;
  final String? image;
  final int stock;
  final int quantity;

  const CartItem({
    required this.productId,
    required this.name,
    required this.price,
    this.image,
    required this.stock,
    required this.quantity,
  });

  factory CartItem.fromMap(Map<String, dynamic> map) {
    return CartItem(
      productId: map['productId'] ?? '',
      name: map['name'] ?? '',
      price: (map['price'] as num?)?.toDouble() ?? 0.0,
      image: map['image'],
      stock: map['stock'] ?? 0,
      quantity: map['quantity'] ?? 1,
    );
  }

  Map<String, dynamic> toMap() => {
        'productId': productId,
        'name': name,
        'price': price,
        'image': image,
        'stock': stock,
        'quantity': quantity,
      };
}

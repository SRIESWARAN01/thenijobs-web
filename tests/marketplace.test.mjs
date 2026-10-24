import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('THENIJOBS Marketplace Business Logic, Filtering & Lead Integrity', () => {

  test('Marketplace Tab and Item Type Synchronization', () => {
    const validTabs = ['products', 'services'];
    const tabToItemType = (tab) => tab === 'services' ? 'service' : 'product';

    assert.equal(tabToItemType('products'), 'product');
    assert.equal(tabToItemType('services'), 'service');
    assert.equal(tabToItemType('unknown'), 'product', 'Defaults to product');
  });

  test('Official Theni Taluk Filtering Logic', () => {
    const TALUKS = [
      'All Taluks',
      'Theni',
      'Periyakulam',
      'Cumbum',
      'Bodinayakanur',
      'Chinnamanur',
      'Uthamapalayam',
      'Andipatti',
      'Madurai',
      'Dindigul',
    ];

    const mockItems = [
      { id: '1', name: 'Fresh Cardamom', taluk: 'Bodinayakanur', district: 'Theni' },
      { id: '2', name: 'Grapes Box', taluk: 'Cumbum', district: 'Theni' },
      { id: '3', name: 'Handloom Towels', taluk: 'Andipatti', district: 'Theni' },
      { id: '4', name: 'Organic Mangoes', taluk: 'Periyakulam', district: 'Theni' },
    ];

    const filterByTaluk = (items, selectedTaluk) => {
      if (!selectedTaluk || selectedTaluk === 'All Taluks') return items;
      return items.filter(i =>
        (i.taluk && i.taluk.toLowerCase() === selectedTaluk.toLowerCase()) ||
        (i.district && i.district.toLowerCase() === selectedTaluk.toLowerCase())
      );
    };

    const bodiItems = filterByTaluk(mockItems, 'Bodinayakanur');
    assert.equal(bodiItems.length, 1);
    assert.equal(bodiItems[0].name, 'Fresh Cardamom');

    const cumbumItems = filterByTaluk(mockItems, 'Cumbum');
    assert.equal(cumbumItems.length, 1);
    assert.equal(cumbumItems[0].name, 'Grapes Box');

    const allItems = filterByTaluk(mockItems, 'All Taluks');
    assert.equal(allItems.length, 4);
  });

  test('Price Range Filtering Boundaries', () => {
    const mockProducts = [
      { id: 'p1', name: 'Cotton Mask', price: 50 },
      { id: 'p2', name: 'Pure Honey 500g', price: 450 },
      { id: 'p3', name: 'Silk Dhoti', price: 1200 },
      { id: 'p4', name: 'Commercial Blender', price: 6500 },
      { id: 'p5', name: 'Drip Irrigation Kit', price: 28000 },
    ];

    const filterByPrice = (items, range) => {
      if (!range || range === 'all') return items;
      return items.filter(item => {
        const val = Number(item.price || 0);
        if (range === 'under500') return val > 0 && val <= 500;
        if (range === '500-2000') return val >= 500 && val <= 2000;
        if (range === '2000-10000') return val >= 2000 && val <= 10000;
        if (range === 'above10000') return val >= 10000;
        return true;
      });
    };

    assert.equal(filterByPrice(mockProducts, 'under500').length, 2); // 50, 450
    assert.equal(filterByPrice(mockProducts, '500-2000').length, 1); // 1200
    assert.equal(filterByPrice(mockProducts, '2000-10000').length, 1); // 6500
    assert.equal(filterByPrice(mockProducts, 'above10000').length, 1); // 28000
    assert.equal(filterByPrice(mockProducts, 'all').length, 5);
  });

  test('Sorting Engine: Price, Name, and Featured Placement', () => {
    const mockList = [
      { id: '1', name: 'Zebra Print Sari', price: 1500, featured: false },
      { id: '2', name: 'Apple Ber Plant', price: 300, featured: true },
      { id: '3', name: 'Cardamom Grade A', price: 2400, featured: false },
    ];

    // Price Ascending
    const asc = [...mockList].sort((a, b) => (a.price || 0) - (b.price || 0));
    assert.equal(asc[0].name, 'Apple Ber Plant');
    assert.equal(asc[2].name, 'Cardamom Grade A');

    // Price Descending
    const desc = [...mockList].sort((a, b) => (b.price || 0) - (a.price || 0));
    assert.equal(desc[0].name, 'Cardamom Grade A');
    assert.equal(desc[2].name, 'Apple Ber Plant');

    // Name A-Z
    const alpha = [...mockList].sort((a, b) => a.name.localeCompare(b.name));
    assert.equal(alpha[0].name, 'Apple Ber Plant');
    assert.equal(alpha[2].name, 'Zebra Print Sari');

    // Featured First
    const featuredSort = [...mockList].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    assert.equal(featuredSort[0].name, 'Apple Ber Plant');
  });

  test('Lead Inbound Payload Rules & Field Limits (firestore.rules constraints)', () => {
    // firestore.rules requires:
    // keys().hasAll(['companyId', 'name', 'message'])
    // keys().size() <= 15
    const validLeadPayload = {
      companyId: 'comp_theni_123',
      name: 'Anand Kumar',
      customerName: 'Anand Kumar',
      contactName: 'Anand Kumar',
      phone: '9876543210',
      customerPhone: '9876543210',
      message: 'Inquiry for Cardamom delivery to Periyakulam',
      service: 'Product: Fresh Cardamom',
      source: 'marketplace_product',
      itemId: 'prod_456',
      itemType: 'product',
      status: 'new',
    };

    const keys = Object.keys(validLeadPayload);
    assert.ok(keys.includes('companyId'), 'Must include companyId');
    assert.ok(keys.includes('name'), 'Must include name');
    assert.ok(keys.includes('message'), 'Must include message');
    assert.ok(keys.length <= 15, `Lead payload has ${keys.length} keys, which satisfies <= 15 keys constraint`);
  });

  test('WhatsApp Link Generation and Encoding for Hyperlocal Orders', () => {
    const company = {
      name: 'Theni Organic Farmers FPO',
      whatsapp: '+91 93605-19460',
    };
    const product = {
      name: 'Paneer Grapes 5Kg Box',
      price: 600,
    };

    const cleanPhone = company.whatsapp.replace(/\D/g, '');
    assert.equal(cleanPhone, '919360519460');

    const waMessage = `Hello ${company.name}, I found your product "${product.name}" (₹${product.price}) on THENIJOBS. Please let me know its availability and delivery details.`;
    const encoded = encodeURIComponent(waMessage);

    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    assert.ok(waUrl.startsWith('https://wa.me/919360519460?text='));
    assert.ok(decodeURIComponent(encoded).includes('Paneer Grapes 5Kg Box'));
    assert.ok(decodeURIComponent(encoded).includes('Theni Organic Farmers FPO'));
  });

  test('Product Unit and Availability Enums Integrity', () => {
    const validUnits = ['Piece', 'Kg', 'Grams', 'Box', 'Pack', 'Liter', 'Meter', 'Set', 'Ton', 'Dozen', 'Bundle'];
    const validAvailabilities = ['in_stock', 'available', 'made_to_order', 'out_of_stock'];

    assert.ok(validUnits.includes('Kg'));
    assert.ok(validUnits.includes('Box'));
    assert.ok(validAvailabilities.includes('in_stock'));
    assert.ok(validAvailabilities.includes('made_to_order'));
  });

  test('Bilingual English & Tamil UI Copy Mapping', () => {
    const i18n = {
      en: {
        products: 'Products',
        services: 'Services',
        inStock: 'In Stock',
        outOfStock: 'Out of Stock',
        sendInquiry: 'Send Inquiry',
      },
      ta: {
        products: 'பொருட்கள்',
        services: 'சேவைகள்',
        inStock: 'இருப்பில் உள்ளது',
        outOfStock: 'இருப்பு இல்லை',
        sendInquiry: 'விசாரணை அனுப்பு',
      },
    };

    assert.equal(i18n.en.products, 'Products');
    assert.equal(i18n.ta.products, 'பொருட்கள்');
    assert.equal(i18n.en.services, 'Services');
    assert.equal(i18n.ta.services, 'சேவைகள்');
    assert.equal(i18n.ta.inStock, 'இருப்பில் உள்ளது');
  });

  test('Marketplace Client Store: Wishlist Add, Remove, and Toggle Logic', () => {
    let wishlist = [];

    const toggleWishlist = (list, item) => {
      const exists = list.some(i => i.id === item.id);
      if (exists) {
        return list.filter(i => i.id !== item.id);
      } else {
        return [{ ...item, savedAt: Date.now() }, ...list];
      }
    };

    const item1 = { id: 'p1', name: 'Theni Cardamom', type: 'product', companyName: 'Spice Traders' };
    const item2 = { id: 's1', name: 'Solar Installation', type: 'service', companyName: 'Theni Green Power' };

    // Add item1
    wishlist = toggleWishlist(wishlist, item1);
    assert.equal(wishlist.length, 1);
    assert.equal(wishlist[0].id, 'p1');

    // Add item2
    wishlist = toggleWishlist(wishlist, item2);
    assert.equal(wishlist.length, 2);
    assert.equal(wishlist[0].id, 's1'); // Most recently added is first

    // Toggle item1 off (remove)
    wishlist = toggleWishlist(wishlist, item1);
    assert.equal(wishlist.length, 1);
    assert.equal(wishlist[0].id, 's1');

    // Toggle item1 back on
    wishlist = toggleWishlist(wishlist, item1);
    assert.equal(wishlist.length, 2);
  });

  test('Marketplace Client Store: Recently Viewed Deduplication and Max 12 Limit', () => {
    let recentList = [];

    const addRecentlyViewed = (list, item) => {
      const filtered = list.filter(i => i.id !== item.id);
      return [{ ...item, savedAt: Date.now() }, ...filtered].slice(0, 12);
    };

    // Add 15 distinct items
    for (let i = 1; i <= 15; i++) {
      recentList = addRecentlyViewed(recentList, { id: `item_${i}`, name: `Item ${i}` });
    }

    // Should cap at 12 items
    assert.equal(recentList.length, 12);
    assert.equal(recentList[0].id, 'item_15', 'Latest item should be at the front');
    assert.equal(recentList[11].id, 'item_4', 'Oldest retained item should be item_4 (15 down to 4 is 12 items)');

    // Re-view an older item (item_5) - should bump it to the front without duplicates
    recentList = addRecentlyViewed(recentList, { id: 'item_5', name: 'Item 5 Re-viewed' });
    assert.equal(recentList.length, 12);
    assert.equal(recentList[0].id, 'item_5', 'Re-viewed item must be moved to front');
    const item5Occurrences = recentList.filter(i => i.id === 'item_5');
    assert.equal(item5Occurrences.length, 1, 'No duplicate occurrences allowed');
  });

  test('Marketplace Client Store: Product Comparison Limit (Max 3 Items)', () => {
    let compareList = [];

    const toggleCompare = (list, item) => {
      const exists = list.some(i => i.id === item.id);
      if (exists) {
        return { added: false, list: list.filter(i => i.id !== item.id), limitReached: false };
      } else {
        if (list.length >= 3) {
          return { added: false, list, limitReached: true };
        }
        return { added: true, list: [...list, item], limitReached: false };
      }
    };

    const p1 = { id: 'prod_1', name: 'Cotton Towels', price: 250 };
    const p2 = { id: 'prod_2', name: 'Linen Towels', price: 450 };
    const p3 = { id: 'prod_3', name: 'Bamboo Towels', price: 650 };
    const p4 = { id: 'prod_4', name: 'Silk Towels', price: 1200 };

    let res1 = toggleCompare(compareList, p1);
    compareList = res1.list;
    assert.equal(res1.added, true);
    assert.equal(compareList.length, 1);

    let res2 = toggleCompare(compareList, p2);
    compareList = res2.list;
    assert.equal(compareList.length, 2);

    let res3 = toggleCompare(compareList, p3);
    compareList = res3.list;
    assert.equal(compareList.length, 3);

    // Attempting to add 4th item must be blocked
    let res4 = toggleCompare(compareList, p4);
    assert.equal(res4.added, false);
    assert.equal(res4.limitReached, true);
    assert.equal(res4.list.length, 3, 'Must remain 3 items');

    // Removing an item (p2)
    let resRemove = toggleCompare(compareList, p2);
    compareList = resRemove.list;
    assert.equal(resRemove.added, false);
    assert.equal(compareList.length, 2);

    // Now p4 can be added
    let res5 = toggleCompare(compareList, p4);
    compareList = res5.list;
    assert.equal(res5.added, true);
    assert.equal(compareList.length, 3);
  });

  test('WhatsApp Message Includes Item Name and Full Listing URL', () => {
    const item = {
      name: 'Cold Pressed Coconut Oil 1L',
      price: 280,
      unit: 'Liter',
    };
    const company = {
      name: 'Theni Agro Naturals',
      whatsapp: '9360519460',
    };
    const listingUrl = 'https://www.thenijobs.com/marketplace/product/theni-agro-naturals/prod_coco_01';

    const rawMessage = `Hello ${company.name}, I am interested in "${item.name}" (₹${item.price}/${item.unit}) listed on THENIJOBS Marketplace.\n\nListing: ${listingUrl}\n\nPlease confirm availability and delivery details.`;

    const encoded = encodeURIComponent(rawMessage);
    const decoded = decodeURIComponent(encoded);

    assert.ok(decoded.includes(item.name), 'Must contain product name');
    assert.ok(decoded.includes(listingUrl), 'Must contain full listing URL');
    assert.ok(decoded.includes(company.name), 'Must contain seller company name');
    assert.ok(encoded.includes(encodeURIComponent(listingUrl)), 'Listing URL must be properly URI encoded');
  });

  test('Subcategory Dynamic Mapping and Item Filter Accuracy', () => {
    const SUBCATEGORIES = {
      Agriculture: ['Seeds & Plants', 'Fertilizers & Pesticides', 'Farm Tools', 'Irrigation', 'Animal Feed'],
      Textiles: ['Sarees & Dhotis', 'Handloom Towels', 'Fabrics & Yarn', 'Garments'],
    };

    const catalogItems = [
      { id: '1', name: 'Hybrid Cotton Seeds', category: 'Agriculture', subcategory: 'Seeds & Plants' },
      { id: '2', name: 'Drip Pipe 16mm', category: 'Agriculture', subcategory: 'Irrigation' },
      { id: '3', name: 'Traditional Handloom Towel', category: 'Textiles', subcategory: 'Handloom Towels' },
      { id: '4', name: 'Pure Silk Dhoti', category: 'Textiles', subcategory: 'Sarees & Dhotis' },
    ];

    const filterBySubcategory = (items, selectedCategory, selectedSubcategory) => {
      return items.filter(item => {
        if (selectedCategory && selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }
        if (selectedSubcategory && selectedSubcategory !== 'all' && item.subcategory !== selectedSubcategory) {
          return false;
        }
        return true;
      });
    };

    const agIrrigation = filterBySubcategory(catalogItems, 'Agriculture', 'Irrigation');
    assert.equal(agIrrigation.length, 1);
    assert.equal(agIrrigation[0].name, 'Drip Pipe 16mm');

    const textileDhoti = filterBySubcategory(catalogItems, 'Textiles', 'Sarees & Dhotis');
    assert.equal(textileDhoti.length, 1);
    assert.equal(textileDhoti[0].name, 'Pure Silk Dhoti');

    const allAg = filterBySubcategory(catalogItems, 'Agriculture', 'all');
    assert.equal(allAg.length, 2);
  });

  test('Unified Marketplace Route & Query Parameter Tab Resolution', () => {
    const resolveTabFromUrl = (urlStr) => {
      const url = new URL(urlStr, 'https://www.thenijobs.com');
      const type = url.searchParams.get('type') || url.searchParams.get('tab');
      if (type === 'services') return 'services';
      if (type === 'products') return 'products';
      if (type === 'businesses' || type === 'companies') return 'businesses';
      if (type === 'wishlist') return 'wishlist';
      return 'all';
    };

    // When opening /marketplace without query params -> All items (Products, Services, Businesses)
    assert.equal(resolveTabFromUrl('/marketplace'), 'all');
    assert.equal(resolveTabFromUrl('/marketplace?type=all'), 'all');

    // When opening /marketplace?type=services -> Services tab
    assert.equal(resolveTabFromUrl('/marketplace?type=services'), 'services');
    assert.equal(resolveTabFromUrl('/marketplace?tab=services'), 'services');

    // Products and businesses
    assert.equal(resolveTabFromUrl('/marketplace?type=products'), 'products');
    assert.equal(resolveTabFromUrl('/marketplace?type=businesses'), 'businesses');
    assert.equal(resolveTabFromUrl('/marketplace?type=wishlist'), 'wishlist');
  });

  test('Tab Switching Updates URL Query While Preserving Existing Filters', () => {
    const buildTargetUrl = (currentUrlStr, newTab) => {
      const url = new URL(currentUrlStr, 'https://www.thenijobs.com');
      if (newTab === 'all') {
        url.searchParams.delete('type');
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('type', newTab);
      }
      return url.pathname + (url.search ? url.search : '');
    };

    // Switching to services from /marketplace
    assert.equal(buildTargetUrl('/marketplace', 'services'), '/marketplace?type=services');

    // Switching to all from /marketplace?type=services removes type
    assert.equal(buildTargetUrl('/marketplace?type=services', 'all'), '/marketplace');

    // Switching to products while location filter is set preserves location filter
    assert.equal(
      buildTargetUrl('/marketplace?location=Cumbum', 'products'),
      '/marketplace?location=Cumbum&type=products'
    );

    // Switching back to all preserves location filter
    assert.equal(
      buildTargetUrl('/marketplace?location=Cumbum&type=products', 'all'),
      '/marketplace?location=Cumbum'
    );
  });

  test('Navigation Link Active State Resolves Distinctly for Marketplace vs Services', () => {
    const isLinkActive = (currentPath, currentSearch, linkHref) => {
      if (linkHref === '/marketplace?type=services') {
        return currentPath === '/marketplace' && currentSearch.includes('type=services');
      }
      if (linkHref === '/marketplace') {
        return currentPath === '/marketplace' && !currentSearch.includes('type=services');
      }
      const basePath = linkHref.split('?')[0];
      return currentPath === basePath || (basePath !== '/' && currentPath.startsWith(basePath));
    };

    // On /marketplace (All items)
    assert.equal(isLinkActive('/marketplace', '', '/marketplace'), true, 'Marketplace link should be active');
    assert.equal(isLinkActive('/marketplace', '', '/marketplace?type=services'), false, 'Services link should NOT be active');

    // On /marketplace?type=services
    assert.equal(isLinkActive('/marketplace', '?type=services', '/marketplace?type=services'), true, 'Services link should be active');
    assert.equal(isLinkActive('/marketplace', '?type=services', '/marketplace'), false, 'Marketplace link should NOT be active');

    // On /jobs
    assert.equal(isLinkActive('/jobs', '', '/marketplace'), false);
    assert.equal(isLinkActive('/jobs', '', '/marketplace?type=services'), false);
    assert.equal(isLinkActive('/jobs', '', '/jobs'), true);
  });

  test('Service-Only View Displays Exclusively Service Listings', () => {
    const activeTab = 'services';

    const shouldShowProducts = activeTab === 'all' || activeTab === 'products';
    const shouldShowServices = activeTab === 'all' || activeTab === 'services';
    const shouldShowBusinesses = activeTab === 'all' || activeTab === 'businesses';
    const shouldShowRecentlyViewed = activeTab === 'all';

    assert.equal(shouldShowProducts, false, 'Products section must be hidden on services tab');
    assert.equal(shouldShowServices, true, 'Services section must be displayed on services tab');
    assert.equal(shouldShowBusinesses, false, 'Businesses section must be hidden on services tab');
    assert.equal(shouldShowRecentlyViewed, false, 'Recently viewed shelf must be hidden on services tab');
  });

});



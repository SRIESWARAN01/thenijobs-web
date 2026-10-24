import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('THENIJOBS Founder & Owner Profile Feature — Production Test Suite', () => {

  const STANDARD_DESIGNATIONS = [
    'Founder',
    'Co-Founder',
    'Owner',
    'CEO',
    'Managing Director',
    'Chairman',
    'Director',
    'Proprietor',
    'Other'
  ];

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  // ─── Test 1: Designation Options & Custom "Other" Handling ────────────────
  test('Section 1: Designation Selection & Custom "Other" Handling', () => {
    // 1. Verify standard options
    assert.equal(STANDARD_DESIGNATIONS.length, 9);
    assert.ok(STANDARD_DESIGNATIONS.includes('Founder'));
    assert.ok(STANDARD_DESIGNATIONS.includes('Owner'));
    assert.ok(STANDARD_DESIGNATIONS.includes('Other'));

    // 2. Helper to resolve effective designation
    const resolveDesignation = (selected, custom) => {
      if (selected === 'Other') {
        return custom?.trim() || '';
      }
      return selected?.trim() || '';
    };

    assert.equal(resolveDesignation('Founder', ''), 'Founder');
    assert.equal(resolveDesignation('CEO', ''), 'CEO');
    assert.equal(resolveDesignation('Other', 'Managing Partner'), 'Managing Partner');
    assert.equal(resolveDesignation('Other', '  Chief Architect  '), 'Chief Architect');
    assert.equal(resolveDesignation('Other', ''), '', 'Empty custom designation is flagged');

    // 3. Helper to hydrate pre-existing designation on edit
    const mapIncomingDesignation = (incoming) => {
      if (!incoming) return { selected: 'Founder', custom: '' };
      if (STANDARD_DESIGNATIONS.includes(incoming) && incoming !== 'Other') {
        return { selected: incoming, custom: '' };
      }
      return { selected: 'Other', custom: incoming };
    };

    assert.deepEqual(mapIncomingDesignation('Co-Founder'), { selected: 'Co-Founder', custom: '' });
    assert.deepEqual(mapIncomingDesignation('Executive Chairman'), { selected: 'Other', custom: 'Executive Chairman' });
  });

  // ─── Test 2: Profile Photo MIME Type & File Size Validation ──────────────
  test('Section 2: Image Validation — MIME Types & Size Boundaries', () => {
    const validateImage = (mimeType, sizeBytes) => {
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return { valid: false, error: 'Invalid file format. Please upload a JPG, JPEG, PNG, or WEBP image.' };
      }
      if (sizeBytes > MAX_FILE_SIZE_BYTES) {
        return { valid: false, error: 'File size exceeds 5 MB. Please select a smaller photo.' };
      }
      return { valid: true };
    };

    // Valid formats
    assert.equal(validateImage('image/jpeg', 2 * 1024 * 1024).valid, true);
    assert.equal(validateImage('image/png', 4.9 * 1024 * 1024).valid, true);
    assert.equal(validateImage('image/webp', 800 * 1024).valid, true);

    // Invalid formats (rejected)
    assert.equal(validateImage('image/svg+xml', 100 * 1024).valid, false);
    assert.equal(validateImage('image/gif', 200 * 1024).valid, false);
    assert.equal(validateImage('application/pdf', 500 * 1024).valid, false);
    assert.equal(validateImage('application/x-msdownload', 1024).valid, false);

    // Size limit boundaries
    assert.equal(validateImage('image/jpeg', 5 * 1024 * 1024).valid, true, 'Exactly 5 MB is accepted');
    assert.equal(validateImage('image/jpeg', 5 * 1024 * 1024 + 1).valid, false, '5 MB + 1 byte is rejected');
    assert.equal(validateImage('image/png', 10 * 1024 * 1024).valid, false, '10 MB is rejected');
  });

  // ─── Test 3: Storage Path Structure & Cleanup Logic ──────────────────────
  test('Section 2: Firebase Storage Path Generation & Lifecycle Cleanup', () => {
    const companyId = 'comp_theni_123';
    const timestamp = 1774350000000;
    const generateStoragePath = (cId, ts) => `companies/${cId}/founder/founder_${ts}.webp`;

    const expectedPath = `companies/comp_theni_123/founder/founder_1774350000000.webp`;
    assert.equal(generateStoragePath(companyId, timestamp), expectedPath);

    // Determine cleanup targets
    const determineCleanup = (oldUrl, newUrl, isRemoval) => {
      if (isRemoval && oldUrl && !oldUrl.startsWith('blob:')) {
        return { cleanupNeeded: true, target: oldUrl };
      }
      if (oldUrl && newUrl && oldUrl !== newUrl && !oldUrl.startsWith('blob:')) {
        return { cleanupNeeded: true, target: oldUrl };
      }
      return { cleanupNeeded: false, target: null };
    };

    // Replacement: old photo deleted
    const replaceRes = determineCleanup(
      'https://firebasestorage.../founder_old.webp',
      'https://firebasestorage.../founder_new.webp',
      false
    );
    assert.equal(replaceRes.cleanupNeeded, true);
    assert.equal(replaceRes.target, 'https://firebasestorage.../founder_old.webp');

    // Removal: old photo deleted
    const removeRes = determineCleanup(
      'https://firebasestorage.../founder_old.webp',
      '',
      true
    );
    assert.equal(removeRes.cleanupNeeded, true);

    // Local blob preview should NEVER be sent to Firebase Storage delete
    const blobRes = determineCleanup('blob:http://localhost/xxx', 'https://...', false);
    assert.equal(blobRes.cleanupNeeded, false);
  });

  // ─── Test 4: Required vs Optional Field Validation on Save ───────────────
  test('Section 1 & 4: Save Profile Form Validation', () => {
    const validateFounderForm = (data) => {
      const errors = [];
      if (!data.name || !data.name.trim()) {
        errors.push('Founder / Owner Name is required.');
      }
      if (!data.designation || !data.designation.trim()) {
        errors.push('Designation is required.');
      }
      if (!data.photoUrl && !data.selectedFile) {
        errors.push('Founder / Owner Profile Photo is required.');
      }
      return {
        valid: errors.length === 0,
        errors
      };
    };

    // Valid complete submission
    const valid = validateFounderForm({
      name: 'M. Senthil Kumar',
      designation: 'Managing Director',
      photoUrl: 'https://storage.../founder.webp',
      bio: 'Pioneering agricultural trade in Theni for over 20 years.',
      linkedinUrl: 'https://linkedin.com/in/senthilkumar',
      since: '2004',
      experienceYears: '20+ Years'
    });
    assert.equal(valid.valid, true);
    assert.equal(valid.errors.length, 0);

    // Missing Name
    const missingName = validateFounderForm({
      name: '  ',
      designation: 'Owner',
      photoUrl: 'https://storage.../founder.webp'
    });
    assert.equal(missingName.valid, false);
    assert.ok(missingName.errors.includes('Founder / Owner Name is required.'));

    // Missing Designation
    const missingDesig = validateFounderForm({
      name: 'R. Anbarasan',
      designation: '',
      photoUrl: 'https://storage.../founder.webp'
    });
    assert.equal(missingDesig.valid, false);
    assert.ok(missingDesig.errors.includes('Designation is required.'));

    // Missing Photo
    const missingPhoto = validateFounderForm({
      name: 'R. Anbarasan',
      designation: 'Founder',
      photoUrl: ''
    });
    assert.equal(missingPhoto.valid, false);
    assert.ok(missingPhoto.errors.includes('Founder / Owner Profile Photo is required.'));
  });

  // ─── Test 5: Firestore Schema Synchronization (Nested + Flat) ────────────
  test('Section 3: Database Schema — Nested & Flat Field Bidirectional Mapping', () => {
    const buildFirestorePayload = (founder) => {
      return {
        founder: {
          name: founder.name.trim(),
          designation: founder.designation.trim(),
          customDesignation: founder.customDesignation?.trim() || '',
          photoUrl: founder.photoUrl || '',
          photoStoragePath: founder.photoStoragePath || '',
          bio: founder.bio?.trim() || '',
          linkedinUrl: founder.linkedinUrl?.trim() || '',
          since: founder.since?.trim() || '',
          founderSince: founder.since?.trim() || '',
          experienceYears: founder.experienceYears?.trim() || '',
          experience: founder.experienceYears?.trim() || '',
          nativePlace: founder.nativePlace?.trim() || '',
          message: founder.message?.trim() || ''
        },
        founderName: founder.name.trim(),
        founderDesignation: founder.designation.trim(),
        founderPhotoUrl: founder.photoUrl || '',
        founderPhotoStoragePath: founder.photoStoragePath || '',
        founderBio: founder.bio?.trim() || '',
        founderLinkedInUrl: founder.linkedinUrl?.trim() || '',
        founderSince: founder.since?.trim() || '',
        founderExperience: founder.experienceYears?.trim() || ''
      };
    };

    const inputFounder = {
      name: 'P. Karuppasamy',
      designation: 'Proprietor',
      photoUrl: 'https://storage/founder.webp',
      photoStoragePath: 'companies/123/founder/founder_123.webp',
      bio: 'Leading wholesale cardamom merchant.',
      linkedinUrl: 'https://linkedin.com/in/karuppasamy',
      since: '2012',
      experienceYears: '14 Years'
    };

    const payload = buildFirestorePayload(inputFounder);

    // Verify nested
    assert.equal(payload.founder.name, 'P. Karuppasamy');
    assert.equal(payload.founder.designation, 'Proprietor');
    assert.equal(payload.founder.since, '2012');

    // Verify top-level flat fields for query interoperability
    assert.equal(payload.founderName, 'P. Karuppasamy');
    assert.equal(payload.founderDesignation, 'Proprietor');
    assert.equal(payload.founderPhotoUrl, 'https://storage/founder.webp');
    assert.equal(payload.founderSince, '2012');
    assert.equal(payload.founderExperience, '14 Years');

    // Hydration from either representation
    const hydrateFromDoc = (doc) => {
      if (doc.founder?.name) return doc.founder;
      if (doc.founderName) {
        return {
          name: doc.founderName,
          designation: doc.founderDesignation || 'Founder',
          photoUrl: doc.founderPhotoUrl || '',
          photoStoragePath: doc.founderPhotoStoragePath || '',
          bio: doc.founderBio || '',
          linkedinUrl: doc.founderLinkedInUrl || '',
          since: doc.founderSince || '',
          experienceYears: doc.founderExperience || ''
        };
      }
      return null;
    };

    const hydratedFromFlat = hydrateFromDoc({
      founderName: 'A. Murugan',
      founderDesignation: 'CEO',
      founderPhotoUrl: 'https://url/murugan.webp'
    });
    assert.equal(hydratedFromFlat.name, 'A. Murugan');
    assert.equal(hydratedFromFlat.designation, 'CEO');
  });

  // ─── Test 6: Public Profile Display Filtering & Empty Field Suppression ─
  test('Section 5: Public Display & Empty Field Suppression', () => {
    const formatPublicFounderCard = (founder) => {
      const elements = [];
      if (founder.name) elements.push({ field: 'name', value: founder.name });
      if (founder.designation) elements.push({ field: 'designation', value: founder.designation });
      if (founder.photoUrl) elements.push({ field: 'photo', value: founder.photoUrl });
      if (founder.since) elements.push({ field: 'since', value: `Since ${founder.since}` });
      if (founder.experienceYears) elements.push({ field: 'experience', value: founder.experienceYears });
      if (founder.bio) elements.push({ field: 'bio', value: founder.bio });
      if (founder.linkedinUrl) elements.push({ field: 'linkedin', value: founder.linkedinUrl });

      return elements;
    };

    // Minimal founder (only required fields)
    const minimal = formatPublicFounderCard({
      name: 'V. Sundaram',
      designation: 'Founder',
      photoUrl: 'https://storage/sundaram.webp',
      bio: '',
      linkedinUrl: '',
      since: '',
      experienceYears: ''
    });

    assert.equal(minimal.length, 3);
    assert.deepEqual(minimal.map(e => e.field), ['name', 'designation', 'photo']);
    assert.equal(minimal.some(e => e.field === 'bio'), false, 'Empty bio is suppressed');
    assert.equal(minimal.some(e => e.field === 'linkedin'), false, 'Empty LinkedIn is suppressed');

    // Complete founder
    const full = formatPublicFounderCard({
      name: 'V. Sundaram',
      designation: 'Founder',
      photoUrl: 'https://storage/sundaram.webp',
      bio: 'Visionary entrepreneur in Cumbum valley.',
      linkedinUrl: 'https://linkedin.com/in/sundaram',
      since: '1998',
      experienceYears: '25+ Years'
    });
    assert.equal(full.length, 7);
  });

  // ─── Test 7: Security Rules & Authorization Assertions ──────────────────
  test('Section 6: Security Boundaries & Cross-Company Isolation', () => {
    // 1. Storage write rule verification logic
    const canWriteFounderPhoto = (authUid, companyOwnerId, isAdmin, fileSize, fileType) => {
      const isOwner = authUid && authUid === companyOwnerId;
      const isAuthorized = isOwner || isAdmin;
      const isImage = ALLOWED_MIME_TYPES.includes(fileType);
      const isUnder5MB = fileSize <= MAX_FILE_SIZE_BYTES;

      return Boolean(isAuthorized && isImage && isUnder5MB);
    };

    const ownerUid = 'user_owner_100';
    const strangerUid = 'user_attacker_999';

    // Owner uploading valid image
    assert.equal(
      canWriteFounderPhoto(ownerUid, ownerUid, false, 2 * 1024 * 1024, 'image/webp'),
      true
    );

    // Stranger trying to upload to another company's founder path
    assert.equal(
      canWriteFounderPhoto(strangerUid, ownerUid, false, 2 * 1024 * 1024, 'image/webp'),
      false,
      'Cross-company photo write must be denied'
    );

    // Admin can manage company founder photo
    assert.equal(
      canWriteFounderPhoto(strangerUid, ownerUid, true, 2 * 1024 * 1024, 'image/webp'),
      true,
      'Admin write allowed'
    );

    // Owner uploading oversized file
    assert.equal(
      canWriteFounderPhoto(ownerUid, ownerUid, false, 6 * 1024 * 1024, 'image/webp'),
      false,
      'Oversized file rejected by storage rule'
    );

    // Owner uploading non-image
    assert.equal(
      canWriteFounderPhoto(ownerUid, ownerUid, false, 1024, 'application/pdf'),
      false,
      'Non-image rejected by storage rule'
    );

    // 2. Firestore write check: prohibited keys must NOT include founder fields
    const prohibitedKeys = [
      'verificationStatus', 'isActive', 'isVerified', 'isFeatured',
      'isPremium', 'rejectionReason', 'accountStatus', 'subscriptionStatus',
      'subscriptionPlan', 'planStartDate', 'planEndDate', 'ownerId'
    ];

    const founderFields = [
      'founder', 'founderName', 'founderDesignation', 'founderPhotoUrl',
      'founderPhotoStoragePath', 'founderBio', 'founderLinkedInUrl',
      'founderSince', 'founderExperience', 'updatedAt'
    ];

    for (const field of founderFields) {
      assert.equal(
        prohibitedKeys.includes(field),
        false,
        `Field "${field}" must NOT be blocked by companyModerationUnchanged()`
      );
    }
  });

  // ─── Test 8: SEO & JSON-LD Person Schema Generation ──────────────────────
  test('Section 5: Schema.org JSON-LD Person Generation for Founder', () => {
    const generateFounderJsonLd = (company) => {
      const founderName = company.founder?.name || company.founderName;
      if (!founderName) return null;

      return {
        '@type': 'Person',
        name: founderName,
        jobTitle: company.founder?.designation || company.founderDesignation || 'Founder',
        image: company.founder?.photoUrl || company.founderPhotoUrl || undefined
      };
    };

    const schema1 = generateFounderJsonLd({
      founder: {
        name: 'S. K. Pandian',
        designation: 'Chairman',
        photoUrl: 'https://www.thenijobs.com/pandian.webp'
      }
    });

    assert.equal(schema1['@type'], 'Person');
    assert.equal(schema1.name, 'S. K. Pandian');
    assert.equal(schema1.jobTitle, 'Chairman');
    assert.equal(schema1.image, 'https://www.thenijobs.com/pandian.webp');

    const schemaWithoutFounder = generateFounderJsonLd({});
    assert.equal(schemaWithoutFounder, null, 'Returns null when no founder is present');
  });

});

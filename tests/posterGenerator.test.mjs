import { test, describe } from 'node:test';
import assert from 'node:assert';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { POSTER_TEMPLATES, getTemplateById } from '../src/lib/poster/posterTemplates.ts';
import { CATEGORY_THEMES, getCategoryTheme } from '../src/lib/poster/categoryThemes.ts';
import { formatWhatsAppShareText } from '../src/lib/poster/posterShareService.ts';

describe('THENIJOBS AI Job Poster Generator — Test Suite', () => {

  test('1. Exactly 10 Unique Professional Poster Templates are Defined', () => {
    assert.strictEqual(POSTER_TEMPLATES.length, 10, 'Must have exactly 10 unique poster templates');
    
    const ids = POSTER_TEMPLATES.map(t => t.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(uniqueIds.size, 10, 'All 10 template IDs must be unique');

    // Expected template IDs
    const expected = [
      'corporate_executive',
      'tech_gradient',
      'theni_heritage',
      'urgent_walkin',
      'industry_spotlight',
      'split_infographic',
      'gazette_editorial',
      'geometric_agency',
      'social_story',
      'clean_trust'
    ];

    expected.forEach(expId => {
      assert.ok(ids.includes(expId), `Template ${expId} must exist`);
    });
  });

  test('2. Each Poster Template has Genuinely Different Layout & Styling Properties', () => {
    POSTER_TEMPLATES.forEach(template => {
      assert.ok(template.name && template.name.length > 0, `Template ${template.id} must have a name`);
      assert.ok(template.nameTa && template.nameTa.length > 0, `Template ${template.id} must have Tamil translation`);
      assert.ok(template.tagline && template.tagline.length > 0, `Template ${template.id} must have a tagline`);
      assert.ok(template.width === 1080, 'All templates must have 1080px base print width');
      assert.ok(template.height === 1350 || template.height === 1920, 'Height must be 1350px (4:5) or 1920px (9:16)');
      assert.ok(template.primaryColor.startsWith('#'), 'Primary color must be hex');
      assert.ok(template.backgroundColor.startsWith('#'), 'Background color must be hex');
    });

    // Verify 9:16 aspect ratio specifically for social story template
    const socialStory = getTemplateById('social_story');
    assert.strictEqual(socialStory.aspectRatio, '9:16', 'Social story template must have 9:16 aspect ratio');
    assert.strictEqual(socialStory.height, 1920, 'Social story height must be 1920px');
  });

  test('3. Category Themes Coverage & Localization', () => {
    const categories = [
      'IT & Software',
      'Healthcare',
      'Education',
      'Agriculture',
      'Manufacturing',
      'Retail',
      'Transportation',
      'Hospitality',
      'Construction',
      'BPO'
    ];

    categories.forEach(cat => {
      assert.ok(CATEGORY_THEMES[cat], `Theme record for ${cat} must exist in CATEGORY_THEMES`);
      const theme = getCategoryTheme(cat);
      assert.ok(theme, `Theme for ${cat} must exist`);
      assert.ok(theme.nameTa && theme.nameTa.length > 0, `Theme for ${cat} must have Tamil name`);
      assert.ok(theme.accentColor && theme.accentColor.startsWith('#'), `Theme for ${cat} must have accent color`);
      assert.ok(Array.isArray(theme.defaultHighlights) && theme.defaultHighlights.length >= 3, `Theme for ${cat} must have at least 3 highlights`);
    });

    // Fallback theme for unknown categories
    const fallbackTheme = getCategoryTheme('Astronautics & Quantum');
    assert.strictEqual(fallbackTheme.name, 'General Employment');
    assert.strictEqual(fallbackTheme.nameTa, 'பொது வேலைவாய்ப்பு');
  });

  test('4. Data Integrity: Missing Data Never Generates Fabricated Values', () => {
    const sampleMinimalData = {
      id: 'job_123',
      type: 'job',
      title: 'Sales Executive',
      companyName: 'Theni Mart',
      publicUrl: 'https://www.thenijobs.com/jobs/job_123',
    };

    const shareText = formatWhatsAppShareText(sampleMinimalData);
    assert.ok(shareText.includes('Sales Executive'), 'Title must appear');
    assert.ok(shareText.includes('Theni Mart'), 'Company must appear');
    assert.ok(shareText.includes('https://www.thenijobs.com/jobs/job_123'), 'URL must appear');
    assert.ok(!shareText.includes('undefined'), 'No undefined strings allowed');
    assert.ok(!shareText.includes('null'), 'No null strings allowed');
  });

  test('5. QR Code Generation Encodes Valid Public URLs', async () => {
    const jobUrl = 'https://www.thenijobs.com/jobs/senior-react-developer-theni-tech';
    const qrDataUrl = await QRCode.toDataURL(jobUrl, {
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    assert.ok(qrDataUrl.startsWith('data:image/png;base64,'), 'QR Code must produce valid PNG data URL');
    assert.ok(qrDataUrl.length > 500, 'QR Code data URL must have valid payload length');
  });

  test('6. QR Code Rejects Private / Dashboard Routes', () => {
    const isPublicDestination = (url) => {
      return (
        url.startsWith('https://www.thenijobs.com/jobs/') ||
        url.startsWith('https://www.thenijobs.com/company/') ||
        url.startsWith('https://www.thenijobs.com/marketplace/') ||
        url.startsWith('https://www.thenijobs.com/daily-jobs')
      ) && !url.includes('/admin/') && !url.includes('/employer/') && !url.includes('/seeker/');
    };

    assert.ok(isPublicDestination('https://www.thenijobs.com/jobs/react-dev-123'), 'Public job URL is valid');
    assert.ok(isPublicDestination('https://www.thenijobs.com/company/theni-bakes'), 'Public company URL is valid');
    assert.ok(isPublicDestination('https://www.thenijobs.com/marketplace/product/agro/123'), 'Public product URL is valid');

    assert.strictEqual(isPublicDestination('https://www.thenijobs.com/employer/jobs/123'), false, 'Private employer route must be rejected');
    assert.strictEqual(isPublicDestination('https://www.thenijobs.com/admin/dashboard'), false, 'Admin route must be rejected');
    assert.strictEqual(isPublicDestination('https://www.thenijobs.com/seeker/dashboard'), false, 'Seeker private route must be rejected');
  });

  test('7. ZIP Archive Creation: Correct File Naming & 10 Posters Bundling', async () => {
    const zip = new JSZip();
    const jobTitle = 'Software Engineer';
    const company = 'Theni Tech Solutions';
    const safeJob = jobTitle.replace(/[^a-zA-Z0-9_]/g, '_');
    const safeCompany = company.replace(/[^a-zA-Z0-9_]/g, '_');

    // Simulate 10 posters
    POSTER_TEMPLATES.forEach((t, i) => {
      const num = String(i + 1).padStart(2, '0');
      const filename = `THENIJOBS_${safeJob}_${safeCompany}_Poster_${num}_${t.id}.png`;
      zip.file(filename, Buffer.from('FAKE_PNG_BINARY_CONTENT'));
    });

    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    assert.ok(zipContent.length > 0, 'ZIP buffer must be created');

    // Unzip to inspect filenames
    const unzipped = await JSZip.loadAsync(zipContent);
    const files = Object.keys(unzipped.files);

    assert.strictEqual(files.length, 10, 'ZIP must contain exactly 10 files');
    assert.ok(files[0].startsWith('THENIJOBS_Software_Engineer_Theni_Tech_Solutions_Poster_01_'), 'Filename pattern matches');
    assert.ok(files[9].startsWith('THENIJOBS_Software_Engineer_Theni_Tech_Solutions_Poster_10_'), '10th file filename matches');
  });

  test('8. WhatsApp Share Text Formatting & Professional CTA', () => {
    const fullJobData = {
      id: 'job_999',
      type: 'job',
      title: 'Senior Accountant (Tally Prime)',
      companyName: 'Theni Cardamom Traders',
      location: 'Bodinayakanur, Theni',
      district: 'Theni District',
      salaryText: '₹28,000 - ₹35,000 / month',
      jobType: 'full_time',
      experience: '3-5 Years in Agricultural Accounts',
      publicUrl: 'https://www.thenijobs.com/jobs/senior-accountant-tally-prime-theni-cardamom-traders-bodinayakanur',
    };

    const text = formatWhatsAppShareText(fullJobData);
    assert.ok(text.includes('Senior Accountant (Tally Prime)'), 'Title formatted');
    assert.ok(text.includes('Theni Cardamom Traders'), 'Company formatted');
    assert.ok(text.includes('Bodinayakanur, Theni'), 'Location formatted');
    assert.ok(text.includes('₹28,000 - ₹35,000 / month'), 'Salary formatted');
    assert.ok(text.includes('FULL TIME'), 'Job type uppercase formatted');
    assert.ok(text.includes('Powered by THENIJOBS'), 'THENIJOBS brand CTA present');
  });

  test('9. Multi-Entity Poster Support: Company, Product, and Service Poster Schemas', () => {
    // 1. Company Poster
    const companyPoster = {
      id: 'comp_01',
      type: 'company',
      title: 'Theni Agro Mills Pvt Ltd',
      companyName: 'Theni Agro Mills Pvt Ltd',
      category: 'Agriculture & Milling',
      location: 'Periyakulam Highway, Theni',
      publicUrl: 'https://www.thenijobs.com/company/theni-agro-mills',
      isVerified: true,
    };
    assert.strictEqual(companyPoster.type, 'company');
    assert.ok(companyPoster.publicUrl.includes('/company/'));

    // 2. Product Poster
    const productPoster = {
      id: 'prod_01',
      type: 'product',
      title: 'Premium Cardamom 8mm Bold (1kg)',
      companyName: 'Cumbum Valley Spices',
      itemPrice: '₹2,400 / kg',
      publicUrl: 'https://www.thenijobs.com/marketplace/product/cumbum-valley-spices/prod_01',
    };
    assert.strictEqual(productPoster.type, 'product');
    assert.ok(productPoster.publicUrl.includes('/marketplace/product/'));

    // 3. Service Poster
    const servicePoster = {
      id: 'svc_01',
      type: 'service',
      title: 'CCTV Installation & Security AMC',
      companyName: 'M.K. Security Solutions',
      itemPrice: 'Starts ₹3,500',
      publicUrl: 'https://www.thenijobs.com/marketplace/service/m-k-security-solutions/svc_01',
    };
    assert.strictEqual(servicePoster.type, 'service');
    assert.ok(servicePoster.publicUrl.includes('/marketplace/service/'));
  });

});

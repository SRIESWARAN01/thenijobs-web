import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import { SEEKER_PUBLIC_PROFILE_FEE_INR } from '../src/lib/constants.ts';
import {
  buildSeekerPortfolioSite,
  CANDIDATE_TEMPLATES,
  CANDIDATE_THEME_PRESETS,
  BANNER_GRADIENT_PRESETS,
} from '../src/lib/portfolio/seekerPortfolioAdapter.ts';

test('THENIJOBS — Candidate Portfolio & Live Device Preview Test Suite', async (t) => {
  await t.test('1. Candidate Public Portfolio Fee is configured to exactly ₹100', () => {
    assert.strictEqual(
      SEEKER_PUBLIC_PROFILE_FEE_INR,
      100,
      'SEEKER_PUBLIC_PROFILE_FEE_INR must be exactly 100 per requirement',
    );
  });

  await t.test('2. Order creation route creates Razorpay orders with ₹100 amount', () => {
    const routePath = path.resolve('src/app/api/payment/seeker-public-profile/create-order/route.ts');
    assert.ok(fs.existsSync(routePath), 'create-order route must exist');
    const content = fs.readFileSync(routePath, 'utf8');
    assert.match(content, /SEEKER_PUBLIC_PROFILE_FEE_INR/, 'create-order must import and use SEEKER_PUBLIC_PROFILE_FEE_INR');
    assert.match(content, /amount \* 100/, 'Paise calculation must multiply amount by 100');
  });

  await t.test('3. Verification route implements HMAC signature check and database activation', () => {
    const verifyRoutePath = path.resolve('src/app/api/payment/seeker-public-profile/verify/route.ts');
    assert.ok(fs.existsSync(verifyRoutePath), 'verify route must exist');
    const content = fs.readFileSync(verifyRoutePath, 'utf8');

    assert.match(content, /verifyRazorpaySignature/, 'Route must invoke verifyRazorpaySignature');
    assert.match(content, /seekerProfiles/, 'Route must update seekerProfiles');
    assert.match(content, /isPortfolioPublic:\s*true/, 'Route must set isPortfolioPublic to true');
    assert.match(content, /publicProfilePaidUntil/, 'Route must set publicProfilePaidUntil');
    assert.match(content, /portfolioSites/, 'Route must activate portfolioSites');
    assert.match(content, /status:\s*'published'/, 'Route must set status to published');
    assert.match(content, /payments/, 'Route must record transaction in payments collection');
  });

  await t.test('4. Exactly 4 unique seeker templates are registered and supported', () => {
    const templateRendererPath = path.resolve('src/components/portfolio/TemplateRenderer.tsx');
    assert.ok(fs.existsSync(templateRendererPath), 'TemplateRenderer must exist');
    const content = fs.readFileSync(templateRendererPath, 'utf8');

    const expectedTemplates = [
      'seeker-modern-pro',
      'seeker-creative',
      'seeker-executive',
      'seeker-minimal',
    ];

    for (const tplId of expectedTemplates) {
      assert.ok(content.includes(tplId), `TemplateRenderer must register ${tplId}`);
    }

    assert.strictEqual(
      CANDIDATE_TEMPLATES.length,
      4,
      'CANDIDATE_TEMPLATES must list exactly 4 unique templates',
    );

    const templateIds = CANDIDATE_TEMPLATES.map((t) => t.id);
    assert.deepStrictEqual(
      templateIds.sort(),
      expectedTemplates.sort(),
      'CANDIDATE_TEMPLATES must match expected 4 template IDs',
    );
  });

  await t.test('5. buildSeekerPortfolioSite synthesizes complete PortfolioSite from profile inputs', () => {
    const mockInput = {
      userId: 'seeker-test-123',
      name: 'Kavitha Murugan',
      headline: 'Full Stack Engineer & React Specialist',
      currentRole: 'Software Engineer',
      bio: 'Enthusiastic developer with 3+ years experience building web applications in Tamil Nadu.',
      email: 'kavitha@example.com',
      phone: '9876543210',
      district: 'Theni',
      state: 'Tamil Nadu',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      resumeUrl: 'https://example.com/resume.pdf',
      workMode: 'Hybrid',
      noticePeriod: 'Immediate Joiner',
      isOpenToWork: true,
      isPortfolioPublic: true,
      skills: [
        { name: 'React', category: 'technical', level: 90 },
        { name: 'Node.js', category: 'technical', level: 85 },
        'TypeScript',
      ],
      experience: [
        {
          id: 'exp-1',
          company: 'AGS IT Solutions',
          role: 'Frontend Developer',
          startDate: '2023',
          endDate: 'Present',
          description: 'Building modern interfaces.',
        },
      ],
      education: [
        {
          id: 'edu-1',
          institution: 'CPA College Bodinayakanur',
          degree: 'B.Sc Computer Science',
          year: '2022',
        },
      ],
      projects: [
        {
          id: 'p-1',
          title: 'Agri E-Commerce Portal',
          description: 'Farm supplies ordering app.',
          technologies: 'React, Firebase, Tailwind',
        },
      ],
      certifications: [
        {
          id: 'c-1',
          name: 'Google Cloud Certified',
          organization: 'Google',
          date: '2024',
        },
      ],
      achievements: [
        {
          id: 'a-1',
          title: 'Smart India Hackathon Finalist',
        },
      ],
    };

    const site = buildSeekerPortfolioSite(mockInput);

    assert.strictEqual(site.ownerId, 'seeker-test-123');
    assert.strictEqual(site.ownerType, 'seeker');
    assert.strictEqual(site.templateId, 'seeker-modern-pro');
    assert.strictEqual(site.status, 'published');
    assert.strictEqual(site.visibility, 'public');

    // Verify sections existence
    const sectionTypes = site.sections.map((s) => s.type);
    assert.ok(sectionTypes.includes('hero'), 'Must contain hero section');
    assert.ok(sectionTypes.includes('about'), 'Must contain about section');
    assert.ok(sectionTypes.includes('skills'), 'Must contain skills section');
    assert.ok(sectionTypes.includes('experience'), 'Must contain experience section');
    assert.ok(sectionTypes.includes('projects'), 'Must contain projects section');
    assert.ok(sectionTypes.includes('education'), 'Must contain education section');
    assert.ok(sectionTypes.includes('certifications'), 'Must contain certifications section');
    assert.ok(sectionTypes.includes('achievements'), 'Must contain achievements section');
    assert.ok(sectionTypes.includes('contact'), 'Must contain contact section');

    // Verify hero data
    const heroSec = site.sections.find((s) => s.type === 'hero');
    assert.strictEqual(heroSec.data.name, 'Kavitha Murugan');
    assert.strictEqual(heroSec.data.title, 'Full Stack Engineer & React Specialist');
    assert.strictEqual(heroSec.data.phone, '9876543210');
    assert.strictEqual(heroSec.data.email, 'kavitha@example.com');
  });

  await t.test('6. Privacy masking respects hidePhone and hideEmail settings in synthesized site', () => {
    const mockPrivate = {
      userId: 'seeker-priv-1',
      name: 'Private Candidate',
      email: 'private@example.com',
      phone: '9998887776',
      privacySettings: {
        hidePhone: true,
        hideEmail: true,
      },
    };

    const site = buildSeekerPortfolioSite(mockPrivate);
    const heroSec = site.sections.find((s) => s.type === 'hero');
    const contactSec = site.sections.find((s) => s.type === 'contact');

    assert.strictEqual(heroSec.data.phone, '', 'Phone must be blank when hidePhone is true');
    assert.strictEqual(heroSec.data.email, '', 'Email must be blank when hideEmail is true');
    assert.strictEqual(contactSec.data.phone, '', 'Contact phone must be blank when hidePhone is true');
    assert.strictEqual(contactSec.data.email, '', 'Contact email must be blank when hideEmail is true');
  });

  await t.test('7. Digital ID Card component is intact and untouched', () => {
    const idCardPath = path.resolve('src/components/id-card/SeekerIDCard.tsx');
    assert.ok(fs.existsSync(idCardPath), 'SeekerIDCard component must exist');
    const content = fs.readFileSync(idCardPath, 'utf8');

    assert.match(content, /export default function SeekerIDCard/, 'SeekerIDCard must export default component');
    assert.match(content, /QRCodeGenerator/, 'SeekerIDCard must retain QRCodeGenerator');
    assert.match(content, /handleDownload/, 'SeekerIDCard must retain download functionality');
  });

  await t.test('8. CandidatePortfolioLiveModal integrates 3 device viewports & dual tabs', () => {
    const modalPath = path.resolve('src/components/portfolio/CandidatePortfolioLiveModal.tsx');
    assert.ok(fs.existsSync(modalPath), 'CandidatePortfolioLiveModal must exist');
    const content = fs.readFileSync(modalPath, 'utf8');

    assert.match(content, /laptop/, 'Must support laptop / desktop view');
    assert.match(content, /tablet/, 'Must support tablet view');
    assert.match(content, /mobile/, 'Must support mobile view');
    assert.match(content, /SeekerIDCard/, 'Must support Digital ID Card tab');
    assert.match(content, /TemplateRenderer/, 'Must support TemplateRenderer for live preview');
    assert.match(content, /SeekerPublicProfileModal/, 'Must integrate SeekerPublicProfileModal for ₹100 publish');
    assert.match(content, /SEEKER_PUBLIC_PROFILE_FEE_INR/, 'Must use SEEKER_PUBLIC_PROFILE_FEE_INR constant');
  });

  await t.test('9. SeekerSiteEditor and SeekerPortfolioClient use unified TemplateRenderer', () => {
    const clientPath = path.resolve('src/app/portfolio/seeker/[id]/SeekerPortfolioClient.tsx');
    assert.ok(fs.existsSync(clientPath), 'SeekerPortfolioClient must exist');
    const clientContent = fs.readFileSync(clientPath, 'utf8');
    assert.match(clientContent, /TemplateRenderer/, 'SeekerPortfolioClient must render TemplateRenderer');
    assert.match(clientContent, /buildSeekerPortfolioSite/, 'SeekerPortfolioClient must use buildSeekerPortfolioSite');
    assert.match(clientContent, /SeekerIDCard/, 'SeekerPortfolioClient must offer SeekerIDCard tab');

    const editorPath = path.resolve('src/components/portfolio/SeekerSiteEditor.tsx');
    const editorContent = fs.readFileSync(editorPath, 'utf8');
    assert.match(editorContent, /SeekerPublicProfileModal/, 'SeekerSiteEditor must integrate SeekerPublicProfileModal');
    assert.match(editorContent, /isPortfolioPublic/, 'SeekerSiteEditor must gate publishing by isPortfolioPublic');
  });
});

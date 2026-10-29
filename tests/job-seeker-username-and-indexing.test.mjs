import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('THENIJOBS — Job Seeker Custom URL Structure, Username Availability, and Google Indexing Protection', async (t) => {
  await t.test('1. Username API exists and enforces correct format, length, and reserved names', () => {
    const routePath = path.resolve('src/app/api/job-seeker/check-username/route.ts');
    assert.ok(fs.existsSync(routePath), 'check-username route must exist');
    const content = fs.readFileSync(routePath, 'utf8');

    // Reserved usernames check
    assert.match(content, /'admin'/, 'admin must be in RESERVED_JOB_SEEKER_USERNAMES');
    assert.match(content, /'job-seeker'/, 'job-seeker must be in RESERVED_JOB_SEEKER_USERNAMES');
    assert.match(content, /'seeker'/, 'seeker must be in RESERVED_JOB_SEEKER_USERNAMES');
    assert.match(content, /'sitemap'/, 'sitemap must be in RESERVED_JOB_SEEKER_USERNAMES');
    assert.match(content, /'robots'/, 'robots must be in RESERVED_JOB_SEEKER_USERNAMES');

    // Validation rules
    assert.match(content, /USERNAME_REGEX\s*=\s*\/[\^]\[a-z0-9\]\+\(\?:-\[a-z0-9\]\+\)\*\$\//, 'Regex must enforce lowercase, numbers, and single hyphens');
    assert.match(content, /username\.length\s*<\s*3\s*\|\|\s*username\.length\s*>\s*35/, 'Must enforce 3 to 35 characters');
    assert.match(content, /portfolioSlugs/, 'Must check portfolioSlugs collection for collision');
    assert.match(content, /portfolioSites/, 'Must check portfolioSites collection for collision');
    assert.match(content, /seekerProfiles/, 'Must check seekerProfiles collection for collision');

    // Bilingual collision guidance
    assert.match(content, /is already taken\. Please choose another username/, 'Must instruct user to pick another username');
    assert.match(content, /என்ற username ஏற்கெனவே பயன்பாட்டில் உள்ளது\. வேறு பெயரைத் தேர்வு செய்யவும்/, 'Must provide clear Tamil instruction');
  });

  await t.test('2. Candidate URL route /job-seeker/[username] exists with canonical and OpenGraph tags', () => {
    const pagePath = path.resolve('src/app/job-seeker/[username]/page.tsx');
    assert.ok(fs.existsSync(pagePath), 'job-seeker/[username]/page.tsx must exist');
    const content = fs.readFileSync(pagePath, 'utf8');

    assert.match(content, /generateStaticParams/, 'Must define generateStaticParams for static builds');
    assert.match(content, /generateMetadata/, 'Must define generateMetadata for server-side SEO tags');
    assert.match(content, /https:\/\/www\.thenijobs\.com\/job-seeker\//, 'Canonical URL must use thenijobs.com/job-seeker/ prefix');
    assert.match(content, /PublicPortfolioPageClient/, 'Must delegate to PublicPortfolioPageClient');
  });

  await t.test('3. Draft or private profiles are strictly excluded from Google Indexing (noindex, nofollow, nocache)', () => {
    const jobSeekerPage = fs.readFileSync(path.resolve('src/app/job-seeker/[username]/page.tsx'), 'utf8');
    assert.match(jobSeekerPage, /site\.status\s*!==\s*'published'\s*\|\|\s*site\.visibility\s*!==\s*'public'\s*\|\|\s*!site\.googleIndex/, 'Gate must verify status, visibility, and googleIndex');
    assert.match(jobSeekerPage, /robots:\s*\{[\s\S]*?index:\s*false[\s\S]*?follow:\s*false[\s\S]*?nocache:\s*true/, 'Must emit robots: { index: false, follow: false, nocache: true } for drafts');

    const portfolioPage = fs.readFileSync(path.resolve('src/app/portfolio/[username]/page.tsx'), 'utf8');
    assert.match(portfolioPage, /robots:\s*\{[\s\S]*?index:\s*false[\s\S]*?follow:\s*false[\s\S]*?nocache:\s*true/, 'Must emit robots: { index: false, follow: false, nocache: true } on draft /portfolio/[username]');

    const clientPage = fs.readFileSync(path.resolve('src/app/portfolio/[username]/PublicPortfolioPageClient.tsx'), 'utf8');
    assert.match(clientPage, /<meta name="robots" content="noindex, nofollow" \/>/, 'Client fallback must include noindex, nofollow meta tag for drafts');
  });

  await t.test('4. Dynamic Sitemap routes published candidate portfolios to /job-seeker/[username]', () => {
    const sitemapContent = fs.readFileSync(path.resolve('src/app/sitemap.ts'), 'utf8');

    assert.match(sitemapContent, /isSeeker\s*\?[\s\S]*?\/job-seeker\/\$\{p\.customUrl\}[\s\S]*?:\s*\`\$\{BASE\}\/portfolio\/\$\{p\.customUrl\}\`/, 'Sitemap must output /job-seeker/[username] for candidate profiles');
    assert.match(sitemapContent, /getPublishedPortfolioSitesForSitemap/, 'Sitemap must call getPublishedPortfolioSitesForSitemap');

    const firestoreServerContent = fs.readFileSync(path.resolve('src/lib/firebase/firestoreServer.ts'), 'utf8');
    assert.match(firestoreServerContent, /status.*?stringValue: 'published'/, 'Must filter by status == published');
    assert.match(firestoreServerContent, /googleIndex.*?booleanValue: true/, 'Must filter by googleIndex == true');
    assert.match(firestoreServerContent, /ownerType:\s*s\.ownerType/, 'Must propagate ownerType');
    assert.match(firestoreServerContent, /templateId:\s*s\.templateId/, 'Must propagate templateId');
  });

  await t.test('5. CandidatePortfolioLiveModal features real-time username editor & availability check', () => {
    const modalPath = path.resolve('src/components/portfolio/CandidatePortfolioLiveModal.tsx');
    assert.ok(fs.existsSync(modalPath), 'CandidatePortfolioLiveModal must exist');
    const content = fs.readFileSync(modalPath, 'utf8');

    assert.match(content, /customUsername/, 'Must track customUsername state');
    assert.match(content, /usernameStatus/, 'Must track usernameStatus state');
    assert.match(content, /\/api\/job-seeker\/check-username\?username=/, 'Must query check-username endpoint');
    assert.match(content, /thenijobs\.com\/job-seeker\//, 'Must display thenijobs.com/job-seeker/ prefix');
    assert.match(content, /Available \/ பயன்படுத்தலாம்/, 'Must provide available status feedback in English and Tamil');
    assert.match(content, /portfolioSlugs/, 'Must reserve slug on save');
    assert.match(content, /disabled=\{savingTheme \|\| usernameStatus === 'taken' \|\| usernameStatus === 'invalid'\}/, 'Must disable save button when username is taken or invalid');
  });

  await t.test('6. UI copy adheres to realistic Google indexing guidance (no false instant indexing promises)', () => {
    const liveModalContent = fs.readFileSync(path.resolve('src/components/portfolio/CandidatePortfolioLiveModal.tsx'), 'utf8');
    assert.match(liveModalContent, /Google-ல் உடனடியாக index ஆகும் என்று உறுதி அளிக்க முடியாது; Google தனது crawling மற்றும் indexing முடிவுகளைத் தானே எடுக்கும்/, 'Modal must contain realistic Tamil Google indexing disclaimer');

    const editorContent = fs.readFileSync(path.resolve('src/components/portfolio/SeekerSiteEditor.tsx'), 'utf8');
    assert.match(editorContent, /thenijobs\.com\/job-seeker\//, 'SeekerSiteEditor must use job-seeker URL');
    assert.match(editorContent, /Google-ல் உடனடியாக index ஆகும் என்று உறுதி அளிக்க முடியாது; Google தனது விதிகளின்படி crawling & indexing செய்யும்/, 'Editor must contain realistic Tamil Google indexing disclaimer');
    assert.doesNotMatch(editorContent, /LIVE & INDEXED/, 'Editor must not claim guaranteed instant indexing');
    assert.doesNotMatch(editorContent, /Publish to Google/, 'Button must not promise direct publish to Google');
  });
});

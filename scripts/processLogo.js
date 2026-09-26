/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const candidates = [
  'C:\\Users\\Anbarasan Suruliraj\\.gemini\\antigravity-ide\\brain\\4f4cd8e1-ed39-417f-a6bf-bb1ee0a090a9\\.user_uploaded\\media_1790193205295.png',
  'C:\\Users\\Anbarasan Suruliraj\\.gemini\\antigravity-ide\\brain\\4f4cd8e1-ed39-417f-a6bf-bb1ee0a090a9\\.user_uploaded\\media_1790191940971.png',
  path.join(__dirname, '..', 'public', 'logo.png'),
];

const srcImage = candidates.find(p => fs.existsSync(p));
const publicDir = path.join(__dirname, '..', 'public');
const appDir = path.join(__dirname, '..', 'src', 'app');

async function generateAssets() {
  if (!srcImage) {
    throw new Error('Source logo image not found in candidate paths.');
  }

  console.log('Reading source image from:', srcImage);

  // 1. Generate full brand logo (public/logo.png - 512x512)
  await sharp(srcImage)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('✓ Created public/logo.png');

  // 2. Generate full brand logo webp (public/logo.webp - 512x512)
  await sharp(srcImage)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .webp({ quality: 95 })
    .toFile(path.join(publicDir, 'logo.webp'));
  console.log('✓ Created public/logo.webp');

  // 3. Extract square emblem (The Theni district map silhouette + career magnifier & rising arrow)
  // Emblem coordinate bounds: X: 318..779, Y: 101..670 -> centered box of 620x620 at left: 238, top: 76
  const emblemBuffer = await sharp(srcImage)
    .extract({ left: 238, top: 76, width: 620, height: 620 })
    .toBuffer();

  // 4. Generate logo-sm.webp (96x96) - Used in Header & Footer avatar badges
  await sharp(emblemBuffer)
    .resize(96, 96, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .webp({ quality: 95 })
    .toFile(path.join(publicDir, 'logo-sm.webp'));
  console.log('✓ Created public/logo-sm.webp');

  // 5. Generate favicon.png (64x64)
  await sharp(emblemBuffer)
    .resize(64, 64, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ Created public/favicon.png');

  // 6. Generate favicon.ico (32x32)
  await sharp(emblemBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  await sharp(emblemBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(appDir, 'favicon.ico'));
  console.log('✓ Created public/favicon.ico and src/app/favicon.ico');

  // 7. Generate App Router icon.png (512x512) and apple-icon.png (180x180)
  await sharp(emblemBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(path.join(appDir, 'icon.png'));
  console.log('✓ Created src/app/icon.png');

  await sharp(emblemBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(path.join(appDir, 'apple-icon.png'));
  console.log('✓ Created src/app/apple-icon.png');

  // 8. Generate PWA icon-192.png & icon-512.png
  await sharp(emblemBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Created public/icon-192.png');

  await sharp(emblemBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Created public/icon-512.png');

  // 9. Generate high-quality OpenGraph banner (1200x630)
  // Create a rounded badge for the emblem
  const emblemSize = 300;
  const roundedEmblem = await sharp(emblemBuffer)
    .resize(emblemSize, emblemSize, { fit: 'contain' })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${emblemSize}" height="${emblemSize}"><rect x="0" y="0" width="${emblemSize}" height="${emblemSize}" rx="36" ry="36" fill="#fff" /></svg>`
        ),
        blend: 'dest-in',
      }
    ])
    .png()
    .toBuffer();

  const ogSvg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A" />
          <stop offset="50%" stop-color="#1E293B" />
          <stop offset="100%" stop-color="#064E3B" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)" />
      <!-- Shadow and border for emblem -->
      <rect x="446" y="46" width="308" height="308" rx="40" fill="none" stroke="#10B981" stroke-width="3" stroke-opacity="0.5" />
      <text x="600" y="435" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">THENI<tspan fill="#10B981">JOBS</tspan></text>
      <text x="600" y="490" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="600" fill="#93C5FD" text-anchor="middle" letter-spacing="3">Search · Connect · Hire · Growth</text>
      <text x="600" y="540" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#94A3B8" text-anchor="middle">The #1 Job &amp; Business Platform for Theni &amp; Tamil Nadu</text>
    </svg>
  `;

  await sharp(Buffer.from(ogSvg))
    .composite([
      {
        input: roundedEmblem,
        top: 50,
        left: 450,
      }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(publicDir, 'og-image.jpg'));
  console.log('✓ Created public/og-image.jpg');

  console.log('🎉 All logo & favicon assets successfully updated with the new THENIJOBS brand identity!');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});

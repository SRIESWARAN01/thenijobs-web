/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcImage = 'C:\\Users\\admin\\.gemini\\antigravity-ide\\brain\\a609b91f-fc26-4a48-b4de-14d327eac6a1\\thenijobs_brand_logo_1786708251088.jpg';
const publicDir = path.join(__dirname, '..', 'public');
const appDir = path.join(__dirname, '..', 'src', 'app');

async function generateAssets() {
  console.log('Reading source image from:', srcImage);
  
  if (!fs.existsSync(srcImage)) {
    throw new Error('Source image not found: ' + srcImage);
  }

  // 1. Generate full brand logo.png (512x512 PNG)
  await sharp(srcImage)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('✓ Created public/logo.png');

  // 2. Generate favicon.png (64x64)
  await sharp(srcImage)
    .resize(64, 64, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ Created public/favicon.png');

  // 3. Generate favicon.ico (32x32 PNG/ICO)
  await sharp(srcImage)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  
  await sharp(srcImage)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(appDir, 'favicon.ico'));
  console.log('✓ Created public/favicon.ico and src/app/favicon.ico');

  // 4. Generate PWA icon-192.png & icon-512.png
  await sharp(srcImage)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Created public/icon-192.png');

  await sharp(srcImage)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Created public/icon-512.png');

  // 5. Generate high quality OpenGraph preview image (1200x630)
  // Create a beautiful branded banner with the logo centered
  const logoResized = await sharp(srcImage)
    .resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  const ogSvg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A" />
          <stop offset="100%" stop-color="#1E3A8A" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)" />
      <text x="600" y="470" font-family="Arial, sans-serif" font-size="52" font-weight="bold" fill="#FFFFFF" text-anchor="middle">THENIJOBS</text>
      <text x="600" y="530" font-family="Arial, sans-serif" font-size="26" fill="#93C5FD" text-anchor="middle">The #1 Job Portal for Theni &amp; Tamil Nadu</text>
    </svg>
  `;

  await sharp(Buffer.from(ogSvg))
    .composite([
      {
        input: logoResized,
        top: 40,
        left: 400,
      }
    ])
    .jpeg({ quality: 95 })
    .toFile(path.join(publicDir, 'og-image.jpg'));
  console.log('✓ Created public/og-image.jpg');

  console.log('🎉 All logo & favicon assets successfully generated!');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});

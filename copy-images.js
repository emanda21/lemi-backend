const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/owner/.gemini/antigravity-ide/brain/614e11bc-2dff-48f5-995e-9939675f5c39';
const publicDir = 'd:/LEMI_AI/public';
const appDir    = 'd:/LEMI_AI/app';

// Ensure public dir exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// ── Copies to public/ ────────────────────────────────────────────────────────
const publicCopies = [
  ['ethiopia_landscape_1782364649626.png',  'ethiopia-bg.jpg'],
  ['ethiopia_highland_bg_1782366641077.png','login_bg.jpg'],
  ['diseased_leaf_1_1782364669142.png',     'leaf1.jpg'],
  ['diseased_leaf_2_1782364681467.png',     'leaf2.jpg'],
  ['diseased_leaf_3_1782364701420.png',     'leaf3.jpg'],
  ['healthy_leaf_1782364713566.png',        'leaf4.jpg'],
  ['lemi_logo_favicon_1782369220715.png',   'lemi-logo.png'],  // general logo use
];

publicCopies.forEach(([src, dest]) => {
  const srcPath  = path.join(srcDir, src);
  const destPath = path.join(publicDir, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅  public/${dest}`);
  } else {
    console.log(`❌  MISSING: ${src}`);
  }
});

// ── Copies to app/ (Next.js App Router favicon detection) ────────────────────
// Next.js auto-serves app/icon.png as the favicon when present.
const appIconSrc  = path.join(srcDir, 'lemi_logo_favicon_1782369220715.png');
const appIconDest = path.join(appDir, 'icon.png');

if (fs.existsSync(appIconSrc)) {
  fs.copyFileSync(appIconSrc, appIconDest);
  console.log('✅  app/icon.png  (favicon)');
} else {
  console.log('❌  MISSING: lemi_logo_favicon PNG');
}

console.log('\nDone! Restart "npm run dev" to see the new favicon.');

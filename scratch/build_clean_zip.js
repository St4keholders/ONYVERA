const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = 'C:\\Users\\juana\\OneDrive\\Escritorio\\Desarrollos\\ONYVERA';
const tempDir = path.join(rootDir, 'scratch', 'theme_bundle');
const zipOut = path.join(rootDir, 'ONYVERA-theme.zip');
const desktopZip = 'C:\\Users\\juana\\OneDrive\\Escritorio\\ONYVERA-theme.zip';

// Clean temp directory
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

const folders = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];

folders.forEach(folder => {
  const src = path.join(rootDir, folder);
  const dest = path.join(tempDir, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
});

// Verify layout/theme.liquid in tempDir
const themeLiquid = path.join(tempDir, 'layout', 'theme.liquid');
console.log('layout/theme.liquid exists in bundle:', fs.existsSync(themeLiquid));

// Compress contents of tempDir directly into ZIP
if (fs.existsSync(zipOut)) fs.unlinkSync(zipOut);

// In PowerShell: Compress-Archive -Path "tempDir\*" -DestinationPath "zipOut"
const psCmd = `Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipOut}' -Force`;
execSync(`powershell.exe -NoProfile -Command "${psCmd}"`, { stdio: 'inherit' });

// Copy to Desktop
fs.copyFileSync(zipOut, desktopZip);

console.log('CLEAN ZIP GENERATED AT ROOT AND DESKTOP:', fs.statSync(zipOut).size, 'bytes');

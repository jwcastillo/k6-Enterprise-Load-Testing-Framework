import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

async function copyAssets() {
  const srcDir = process.cwd();
  const distDir = path.join(process.cwd(), 'dist');

  console.log('📦 Copying assets to dist...');

  // Find all data files (csv, json) in clients directory
  const files = await glob('clients/**/data/**/*.{csv,json}', { cwd: srcDir });

  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(distDir, file);
    
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(srcPath, destPath);
    console.log(`  ✅ Copied ${file}`);
  }

  // Also copy config files
  const configFiles = await glob('clients/**/config/**/*.json', { cwd: srcDir });
  for (const file of configFiles) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(distDir, file);
    
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(srcPath, destPath);
    console.log(`  ✅ Copied ${file}`);
  }

  console.log('✨ Assets copied successfully');
}

copyAssets().catch(console.error);

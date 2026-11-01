// Post-build script: add .js extensions to relative imports in ESM output
// so the build works directly in browsers without a bundler.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';

const distDir = join(import.meta.dirname, '..', 'dist', 'esm');

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walk(full));
    } else if (entry.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

function resolveImport(fromFile, importPath) {
  const dir = dirname(fromFile);
  const resolved = join(dir, importPath);
  // Check if it's a file (add .js)
  try {
    statSync(resolved + '.js');
    return importPath + '.js';
  } catch {}
  // Check if it's a directory (add /index.js)
  try {
    statSync(join(resolved, 'index.js'));
    return importPath.replace(/\/$/, '') + '/index.js';
  } catch {}
  return null;
}

let fixed = 0;
for (const file of walk(distDir)) {
  let content = readFileSync(file, 'utf-8');
  const original = content;

  // Match relative imports: from './xxx' or from '../xxx' (not already ending in .js)
  content = content.replace(
    /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
    (match, prefix, importPath, suffix) => {
      if (importPath.endsWith('.js')) return match;
      const resolved = resolveImport(file, importPath);
      if (resolved) {
        return prefix + resolved + suffix;
      }
      return match;
    }
  );

  // Also fix dynamic imports: import('./xxx')
  content = content.replace(
    /(import\s*\(\s*['"])(\.\.?\/[^'"]+?)(['"]\s*\))/g,
    (match, prefix, importPath, suffix) => {
      if (importPath.endsWith('.js')) return match;
      const resolved = resolveImport(file, importPath);
      if (resolved) {
        return prefix + resolved + suffix;
      }
      return match;
    }
  );

  if (content !== original) {
    writeFileSync(file, content);
    fixed++;
  }
}

console.log(`Fixed ESM imports in ${fixed} files.`);

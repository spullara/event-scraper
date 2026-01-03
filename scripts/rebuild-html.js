#!/usr/bin/env node

/**
 * Rebuild the public/index.html with clean bookmarklet code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname); // Go up one level from scripts/

const bookmarkletPath = path.join(rootDir, 'bookmarklet', 'bookmarklet.js');
const htmlPath = path.join(rootDir, 'public', 'index.html');

console.log('🔨 Rebuilding HTML with clean bookmarklet code...\n');

// Read the bookmarklet source
let bookmarkletCode = fs.readFileSync(bookmarkletPath, 'utf8');

// Read the HTML
let html = fs.readFileSync(htmlPath, 'utf8');

// Find the script section and completely replace it
const scriptStartMarker = '  <script>';
const scriptEndMarker = '  </script>';

const scriptStart = html.indexOf(scriptStartMarker);
const scriptEnd = html.indexOf(scriptEndMarker, scriptStart);

if (scriptStart === -1 || scriptEnd === -1) {
  console.error('❌ Could not find script section in HTML');
  process.exit(1);
}

// Build the new script section with the raw bookmarklet code
// We'll use a data attribute approach to avoid escaping issues
const newScript = `  <script>
    // Bookmarklet code - loaded from bookmarklet/bookmarklet.js
    // This code is minified and set dynamically to keep the HTML clean
    const bookmarkletCode = ${JSON.stringify(bookmarkletCode)};
    
    document.getElementById('bookmarklet').href = 'javascript:' + encodeURIComponent(bookmarkletCode);
  </script>`;

// Replace the script section
const before = html.substring(0, scriptStart);
const after = html.substring(scriptEnd + scriptEndMarker.length);

const newHtml = before + newScript + after;

// Write back
fs.writeFileSync(htmlPath, newHtml, 'utf8');

console.log('✅ Successfully rebuilt HTML with clean bookmarklet code');
console.log(`   Bookmarklet size: ${bookmarkletCode.length} characters\n`);


#!/usr/bin/env node

/**
 * Sync the bookmarklet code from bookmarklet/bookmarklet.js to public/index.html
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bookmarkletPath = path.join(__dirname, 'bookmarklet', 'bookmarklet.js');
const htmlPath = path.join(__dirname, 'public', 'index.html');

console.log('📝 Syncing bookmarklet code to HTML...\n');

// Read the bookmarklet source
const bookmarkletCode = fs.readFileSync(bookmarkletPath, 'utf8');

// Minify: remove comments, collapse whitespace, but keep it readable
const minified = bookmarkletCode
  .replace(/\/\/ .*$/gm, '') // Remove single-line comments
  .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments  
  .replace(/\n\s*\n/g, '\n') // Remove empty lines
  .replace(/\s+/g, ' ') // Collapse whitespace
  .replace(/\s*([{}();,:])\s*/g, '$1') // Remove spaces around punctuation
  .replace(/;\s*}/g, '}') // Remove semicolons before closing braces
  .trim();

// Read the HTML file
let html = fs.readFileSync(htmlPath, 'utf8');

// Find the script tag with bookmarkletCode and replace it
const scriptStart = html.indexOf('const bookmarkletCode = `');
const scriptEnd = html.indexOf('`;', scriptStart);

if (scriptStart === -1 || scriptEnd === -1) {
  console.error('❌ Could not find bookmarklet code in HTML');
  process.exit(1);
}

// Replace the bookmarklet code
const before = html.substring(0, scriptStart);
const after = html.substring(scriptEnd + 2);

// Escape backticks and dollar signs in the code
const escaped = minified
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$/g, '\\$');

const newHtml = before + 'const bookmarkletCode = `' + escaped + '`' + after;

// Write back
fs.writeFileSync(htmlPath, newHtml, 'utf8');

console.log('✅ Successfully synced bookmarklet code to public/index.html');
console.log(`   Minified size: ${minified.length} characters\n`);


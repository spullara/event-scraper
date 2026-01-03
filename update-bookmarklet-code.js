#!/usr/bin/env node

/**
 * Script to update the bookmarklet code in public/index.html
 * Reads from bookmarklet/bookmarklet.js and updates the HTML
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bookmarkletPath = path.join(__dirname, 'bookmarklet', 'bookmarklet.js');
const htmlPath = path.join(__dirname, 'public', 'index.html');

// Read the bookmarklet source
let bookmarkletCode = fs.readFileSync(bookmarkletPath, 'utf8');

// Remove the IIFE wrapper and 'use strict' for minification
bookmarkletCode = bookmarkletCode
  .replace(/^\(function\(\) \{\s*'use strict';\s*/m, '')
  .replace(/\}\)\(\);\s*$/m, '')
  .trim();

// Simple minification: remove comments and extra whitespace
bookmarkletCode = bookmarkletCode
  .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
  .replace(/\/\/.*$/gm, '') // Remove single-line comments
  .replace(/\s+/g, ' ') // Collapse whitespace
  .replace(/\s*([{}();,:])\s*/g, '$1') // Remove spaces around punctuation
  .replace(/;\s*}/g, '}') // Remove semicolons before closing braces
  .trim();

// Wrap in IIFE
const minified = `(function(){${bookmarkletCode}})();`;

// Read the HTML file
let html = fs.readFileSync(htmlPath, 'utf8');

// Find and replace the bookmarklet code
const regex = /const bookmarkletCode = `[^`]*`;/;
const replacement = `const bookmarkletCode = \`${minified.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;`;

if (regex.test(html)) {
  html = html.replace(regex, replacement);
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('✅ Successfully updated bookmarklet code in public/index.html');
} else {
  console.error('❌ Could not find bookmarklet code in public/index.html');
  process.exit(1);
}


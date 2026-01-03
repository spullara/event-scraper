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
let bookmarkletCode = fs.readFileSync(bookmarkletPath, 'utf8');

// The bookmarklet is already wrapped in (function() { ... })();
// We just need to minify it carefully without breaking the structure

// First, remove comments
bookmarkletCode = bookmarkletCode
  .split('\n')
  .map(line => {
    // Remove single-line comments but preserve URLs with //
    const commentIndex = line.indexOf('//');
    if (commentIndex !== -1) {
      // Check if it's in a string or URL
      const beforeComment = line.substring(0, commentIndex);
      if (!beforeComment.includes('http:') && !beforeComment.includes('https:')) {
        return line.substring(0, commentIndex);
      }
    }
    return line;
  })
  .join('\n');

// Remove multi-line comments
bookmarkletCode = bookmarkletCode.replace(/\/\*[\s\S]*?\*\//g, '');

// Minify: collapse whitespace but preserve structure
const minified = bookmarkletCode
  .replace(/\n\s*\n/g, '\n') // Remove empty lines
  .replace(/\s+/g, ' ') // Collapse whitespace
  .replace(/\s*([{}();,:])\s*/g, '$1') // Remove spaces around punctuation
  .replace(/;\s*}/g, '}') // Remove semicolons before closing braces
  .replace(/\s*=>\s*/g, '=>') // Clean up arrow functions
  .trim();

// Read the HTML file
let html = fs.readFileSync(htmlPath, 'utf8');

// Find the script tag with bookmarkletCode and replace it
// We need to find the FIRST occurrence and the FIRST `;` after it
const marker = 'const bookmarkletCode = `';
const scriptStart = html.indexOf(marker);

if (scriptStart === -1) {
  console.error('❌ Could not find bookmarklet code in HTML');
  process.exit(1);
}

// Find the matching closing backtick and semicolon
// Start searching after the marker
let searchPos = scriptStart + marker.length;
let depth = 0;
let scriptEnd = -1;

// Look for the pattern `; that closes the assignment
// We need to handle escaped backticks
for (let i = searchPos; i < html.length - 1; i++) {
  if (html[i] === '\\' && html[i + 1] === '`') {
    // Skip escaped backtick
    i++;
    continue;
  }
  if (html[i] === '`' && html[i + 1] === ';') {
    scriptEnd = i;
    break;
  }
}

if (scriptEnd === -1) {
  console.error('❌ Could not find bookmarklet code end in HTML');
  process.exit(1);
}

// Replace the bookmarklet code
const before = html.substring(0, scriptStart);
const after = html.substring(scriptEnd + 2); // Skip `;

// Escape backticks and dollar signs in the code
const escaped = minified
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$/g, '\\$');

const newHtml = before + marker + escaped + '`' + after;

// Write back
fs.writeFileSync(htmlPath, newHtml, 'utf8');

console.log('✅ Successfully synced bookmarklet code to public/index.html');
console.log(`   Minified size: ${minified.length} characters\n`);


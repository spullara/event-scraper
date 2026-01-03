#!/usr/bin/env node

/**
 * Script to update the API URL in the bookmarklet
 * Usage: node update-bookmarklet-url.js <production-url>
 * Example: node update-bookmarklet-url.js https://event-scraper.vercel.app
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Error: Please provide the production URL');
  console.log('\nUsage: node update-bookmarklet-url.js <production-url>');
  console.log('Example: node update-bookmarklet-url.js https://event-scraper.vercel.app');
  process.exit(1);
}

const productionUrl = args[0].replace(/\/$/, ''); // Remove trailing slash
const apiEndpoint = `${productionUrl}/api/extract-event`;

console.log(`\n📝 Updating bookmarklet URL to: ${apiEndpoint}\n`);

// Read the index.html file
const indexPath = path.join(__dirname, 'public', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// Replace the localhost URL with production URL
const oldUrl = 'http://localhost:3000/api/extract-event';
const updatedContent = content.replace(new RegExp(oldUrl, 'g'), apiEndpoint);

// Check if any replacements were made
if (content === updatedContent) {
  console.log('⚠️  Warning: No localhost URLs found to replace');
  console.log('   The bookmarklet may already be configured for production');
} else {
  // Write the updated content back
  fs.writeFileSync(indexPath, updatedContent, 'utf8');
  console.log('✅ Successfully updated public/index.html');
  console.log(`   Old URL: ${oldUrl}`);
  console.log(`   New URL: ${apiEndpoint}`);
}

// Also update the bookmarklet source file
const bookmarkletPath = path.join(__dirname, 'bookmarklet', 'bookmarklet.js');
let bookmarkletContent = fs.readFileSync(bookmarkletPath, 'utf8');
const updatedBookmarkletContent = bookmarkletContent.replace(new RegExp(oldUrl, 'g'), apiEndpoint);

if (bookmarkletContent !== updatedBookmarkletContent) {
  fs.writeFileSync(bookmarkletPath, updatedBookmarkletContent, 'utf8');
  console.log('✅ Successfully updated bookmarklet/bookmarklet.js');
}

console.log('\n✨ Done! Remember to:');
console.log('   1. Commit the changes: git add -A && git commit -m "Update bookmarklet for production"');
console.log('   2. Deploy to Vercel: vercel --prod');
console.log('   3. Test the bookmarklet from your production URL\n');


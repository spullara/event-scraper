#!/usr/bin/env node

/**
 * Validate the bookmarklet code in public/index.html
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, 'public', 'index.html');

console.log('🔍 Validating bookmarklet code in HTML...\n');

// Read the HTML file
const html = fs.readFileSync(htmlPath, 'utf8');

// Extract the bookmarklet code
// It's stored as: const bookmarkletCode = "..."; or const bookmarkletCode = `...`;
const match = html.match(/const bookmarkletCode = (["'`])([\s\S]*?)\1;/);

if (!match) {
  console.error('❌ Could not find bookmarklet code in HTML');
  console.error('   Looking for pattern: const bookmarkletCode = ...');
  process.exit(1);
}

// The code might be JSON-encoded, so parse it
let code = match[2];

// If it looks like a JSON string, parse it
if (code.startsWith('"') || code.startsWith("'")) {
  try {
    code = JSON.parse(match[1] + code + match[1]);
  } catch (e) {
    // Not JSON, use as-is
  }
}

console.log('📊 Code Statistics:');
console.log(`   Length: ${code.length} characters`);
console.log(`   First 100 chars: ${code.substring(0, 100)}...`);
console.log(`   Last 100 chars: ...${code.substring(code.length - 100)}`);

// Check for issues
const issues = [];

// Check for duplicate IIFE closures
const closureCount = (code.match(/}\)\(\);/g) || []).length;
console.log(`\n🔍 Structure Check:`);
console.log(`   IIFE closures (})();): ${closureCount}`);

if (closureCount > 1) {
  issues.push(`Found ${closureCount} IIFE closures - should only have 1`);
}

// Check if it starts and ends correctly (handle escaped newlines)
const trimmedCode = code.trim().replace(/\\n/g, '');
if (!trimmedCode.startsWith('(function()')) {
  issues.push('Code should start with (function()');
}

if (!trimmedCode.endsWith('})();')) {
  issues.push('Code should end with })();');
}

// Try to validate as JavaScript
console.log(`\n🧪 JavaScript Validation:`);
try {
  // The code might have literal \n which need to be actual newlines for validation
  const codeToValidate = code.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  new Function(codeToValidate);
  console.log('   ✅ Code is valid JavaScript');
} catch (error) {
  issues.push(`Syntax error: ${error.message}`);
  console.log(`   ❌ Syntax error: ${error.message}`);
}

// Check for required functions
const requiredFunctions = [
  'extractStructuredData',
  'extractPlainText',
  'createModal',
  'showLoading',
  'showError',
  'main'
];

console.log(`\n📋 Required Functions:`);
requiredFunctions.forEach(fn => {
  if (code.includes(`function ${fn}`)) {
    console.log(`   ✅ ${fn}`);
  } else {
    console.log(`   ❌ ${fn} - MISSING`);
    issues.push(`Missing function: ${fn}`);
  }
});

// Check for required constants
console.log(`\n🔧 Required Constants:`);
if (code.includes('const API_URL')) {
  console.log('   ✅ API_URL');
} else {
  console.log('   ❌ API_URL - MISSING');
  issues.push('Missing constant: API_URL');
}

// Summary
console.log(`\n${'='.repeat(50)}`);
if (issues.length === 0) {
  console.log('✅ All validation checks passed!');
  console.log('   The bookmarklet code is ready to deploy.');
  process.exit(0);
} else {
  console.log('❌ Validation failed with the following issues:');
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
  process.exit(1);
}


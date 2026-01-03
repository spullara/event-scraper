#!/usr/bin/env node

/**
 * Test what Gemini returns for timezone handling
 */

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Local Test Event",
  "startDate": "2026-04-20T14:00:00-07:00",
  "endDate": "2026-04-20T17:00:00-07:00",
  "location": {
    "@type": "Place",
    "name": "Test Venue"
  }
};

const payload = {
  text: JSON.stringify(structuredData),
  browserTimezone: "America/Los_Angeles"
};

console.log('Testing what Gemini returns for structured data...\n');

fetch('https://grabcal.com/api/extract-event', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload)
})
.then(response => response.text())
.then(html => {
  console.log('📋 Full Response:\n');
  console.log(html);
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Extract dates parameter
  const datesMatch = html.match(/dates=([^&"]+)/);
  if (datesMatch) {
    const dates = decodeURIComponent(datesMatch[1]);
    console.log('Dates parameter:', dates);
    
    // Parse the dates
    const [start, end] = dates.split('/');
    console.log('Start:', start);
    console.log('End:', end);
    
    // Check if correct
    if (start.includes('T140000')) {
      console.log('✅ Start time is correct (14:00 = 2 PM)');
    } else {
      console.log('❌ Start time is WRONG!');
      console.log('   Expected: ...T140000');
      console.log('   Got:', start);
    }
  }
})
.catch(error => {
  console.error('❌ Error:', error.message);
});


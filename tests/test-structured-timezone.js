#!/usr/bin/env node

/**
 * Test timezone handling with structured data
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

console.log('Testing structured data timezone handling...\n');
console.log('Structured data:', JSON.stringify(structuredData, null, 2));
console.log('\nPayload:', JSON.stringify(payload, null, 2));

fetch('https://grabcal.com/api/extract-event', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload)
})
.then(response => response.text())
.then(html => {
  console.log('\n📋 Response received\n');
  
  // Extract dates parameter
  const datesMatch = html.match(/dates=([^&"]+)/);
  if (datesMatch) {
    const dates = decodeURIComponent(datesMatch[1]);
    console.log('✅ Dates parameter:', dates);
    
    // Check if it's 14:00-17:00 (2 PM - 5 PM)
    if (dates.includes('T140000') && dates.includes('T170000')) {
      console.log('✅ Times are correct: 14:00 (2 PM) to 17:00 (5 PM)');
    } else {
      console.log('❌ Times are incorrect!');
      console.log('   Expected: ...T140000/...T170000');
      console.log('   Got:', dates);
    }
  } else {
    console.log('❌ No dates parameter found');
    console.log('Response preview:', html.substring(0, 500));
  }
  
  // Extract timezone parameter
  const ctzMatch = html.match(/ctz=([^&"]+)/);
  if (ctzMatch) {
    const ctz = decodeURIComponent(ctzMatch[1]);
    console.log('✅ Timezone parameter:', ctz);
  } else {
    console.log('❌ No timezone parameter found');
  }
})
.catch(error => {
  console.error('❌ Error:', error.message);
});


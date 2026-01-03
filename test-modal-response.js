// Test the new modal-friendly API response

const testEventPageContent = `
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Tech Innovation Summit 2026",
  "startDate": "2026-03-15T09:00:00-07:00",
  "endDate": "2026-03-15T17:00:00-07:00",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "eventStatus": "https://schema.org/EventScheduled",
  "location": {
    "@type": "Place",
    "name": "San Francisco Convention Center",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "747 Howard St",
      "addressLocality": "San Francisco",
      "addressRegion": "CA",
      "postalCode": "94103",
      "addressCountry": "US"
    }
  },
  "description": "Join us for a full day of cutting-edge tech talks, hands-on workshops, and networking with industry leaders.",
  "organizer": {
    "@type": "Organization",
    "name": "Tech Innovators Association",
    "url": "https://techinnovators.example.com"
  }
}
`;

async function testModalResponse() {
  console.log('Testing Modal-Friendly API Response...\n');
  console.log('URL: https://event-scraper-eight.vercel.app/api/extract-event\n');
  
  try {
    const response = await fetch('https://event-scraper-eight.vercel.app/api/extract-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: testEventPageContent }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    console.log('✅ Production API Response received');
    console.log('Response length:', html.length, 'characters\n');
    
    // Check for modal-friendly features
    const checks = {
      'Event title found': html.includes('Tech Innovation Summit 2026'),
      'Close button present': html.includes('data-close-modal'),
      'Modal-friendly styling': html.includes('event-scraper-container'),
      'No full HTML structure': !html.includes('<!DOCTYPE html>'),
      'Google Calendar link': html.includes('calendar.google.com'),
      'ICS download link': html.includes('data:text/calendar'),
      'Header with emoji': html.includes('📅 Event Found'),
    };
    
    console.log('Modal-Friendly Features Check:');
    console.log('================================');
    for (const [check, passed] of Object.entries(checks)) {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
    }
    
    const allPassed = Object.values(checks).every(v => v);
    
    if (allPassed) {
      console.log('\n🎉 All checks passed! Modal is ready to use!\n');
      console.log('📍 Test it yourself at: https://event-scraper-eight.vercel.app/test-event.html\n');
    } else {
      console.log('\n⚠️  Some checks failed. Review the response.\n');
    }
    
  } catch (error) {
    console.error('❌ Error testing production API:', error.message);
  }
}

testModalResponse();


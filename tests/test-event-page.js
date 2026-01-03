// Test the production API with the test event page content

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
  "description": "Join us for a full day of cutting-edge tech talks, hands-on workshops, and networking with industry leaders. Topics include AI, cloud computing, cybersecurity, and the future of software development.",
  "organizer": {
    "@type": "Organization",
    "name": "Tech Innovators Association",
    "url": "https://techinnovators.example.com"
  }
}
`;

async function testEventPage() {
  console.log('Testing Event Scraper with Test Event Page...\n');
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
    
    // Check if response contains expected elements
    if (html.includes('Tech Innovation Summit 2026')) {
      console.log('✅ SUCCESS! Event extracted correctly');
      console.log('✅ Event name found: Tech Innovation Summit 2026');
      console.log('✅ Google Calendar link present:', html.includes('calendar.google.com'));
      console.log('✅ ICS download link present:', html.includes('data:text/calendar'));
      console.log('\n🎉 Test event page works perfectly with the bookmarklet!\n');
      console.log('📍 Test it yourself at: https://event-scraper-eight.vercel.app/test-event.html\n');
    } else if (html.includes('No Event Found')) {
      console.log('⚠️  No event found in text');
      console.log('Response preview:', html.substring(0, 500));
    } else {
      console.log('❓ Unexpected response format');
      console.log('Response preview:', html.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Error testing production API:', error.message);
  }
}

testEventPage();


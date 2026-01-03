// Test the production API
const testText = `
Join us for the Annual Tech Conference 2024!

Date: March 15, 2024 at 9:00 AM
Location: San Francisco Convention Center, 747 Howard St, San Francisco, CA 94103
Description: A full day of talks, workshops, and networking with industry leaders.

The conference will run from 9:00 AM to 5:00 PM.
Registration includes lunch and refreshments.
`;

async function testProductionAPI() {
  console.log('Testing Production Event Scraper API...\n');
  console.log('URL: https://event-scraper-eight.vercel.app/api/extract-event\n');
  
  try {
    const response = await fetch('https://event-scraper-eight.vercel.app/api/extract-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: testText }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    console.log('✅ Production API Response received');
    console.log('Response length:', html.length, 'characters\n');
    
    // Check if response contains expected elements
    if (html.includes('Event Found')) {
      console.log('✅ SUCCESS! Event extracted correctly');
      console.log('✅ Google Calendar link present:', html.includes('calendar.google.com'));
      console.log('✅ ICS download link present:', html.includes('data:text/calendar'));
      console.log('\n🎉 Production deployment is working perfectly!\n');
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

testProductionAPI();


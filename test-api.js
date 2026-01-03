// Simple test script for the API
const testText = `
Join us for the Annual Tech Conference 2024!

Date: March 15, 2024 at 9:00 AM
Location: San Francisco Convention Center, 747 Howard St, San Francisco, CA 94103
Description: A full day of talks, workshops, and networking with industry leaders.

The conference will run from 9:00 AM to 5:00 PM.
Registration includes lunch and refreshments.
`;

async function testAPI() {
  console.log('Testing Event Scraper API...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/extract-event', {
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

    console.log('✅ API Response received');
    console.log('Response length:', html.length, 'characters');
    console.log('\nFull HTML Response:');
    console.log(html);
    console.log('\n');
    
    // Check if response contains expected elements
    if (html.includes('Event Found') || html.includes('Multiple Events Found')) {
      console.log('✅ Success response detected');
    } else if (html.includes('No Event Found')) {
      console.log('⚠️  No event found in text');
    } else {
      console.log('❓ Unexpected response format');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAPI();


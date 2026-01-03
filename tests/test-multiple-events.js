// Test script for multiple events
const testText = `
Upcoming Events This Month:

1. Tech Meetup
Date: January 10, 2026 at 6:00 PM
Location: Tech Hub, 123 Main St
Join us for networking and tech talks!

2. Workshop: Introduction to AI
Date: January 15, 2026 at 2:00 PM
Location: Learning Center, 456 Oak Ave
Learn the basics of artificial intelligence in this hands-on workshop.

3. Startup Pitch Night
Date: January 20, 2026 at 7:00 PM
Location: Innovation Space, 789 Pine St
Watch local startups pitch their ideas to investors.
`;

async function testAPI() {
  console.log('Testing GrabCal API with multiple events...\n');

  try {
    const response = await fetch('https://grabcal.com/api/extract-event', {
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
    console.log('Response length:', html.length, 'characters\n');
    
    // Check if response contains expected elements
    if (html.includes('Multiple Events Found')) {
      console.log('✅ Multiple events detected correctly');

      // Count how many event items are in the response by counting <h3> tags
      const eventCount = (html.match(/<h3>/g) || []).length;
      console.log(`   Found ${eventCount} events in response`);

      // Extract event titles
      const titles = html.match(/<h3>([^<]+)<\/h3>/g);
      if (titles) {
        console.log('\n   Event titles:');
        titles.forEach((title, i) => {
          console.log(`   ${i+1}. ${title.replace(/<\/?h3>/g, '')}`);
        });
      }
    } else if (html.includes('Event Found')) {
      console.log('⚠️  Single event response (expected multiple)');
    } else if (html.includes('No Event Found')) {
      console.log('❌ No events found');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAPI();


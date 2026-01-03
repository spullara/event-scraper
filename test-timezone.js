// Test timezone handling in the event scraper

async function testTimezone() {
  console.log('Testing Timezone Handling...\n');

  const testCases = [
    {
      name: 'Event with PST timezone',
      text: 'Join us for a Tech Conference on January 15, 2026 at 2:00 PM PST in San Francisco. The event will run until 5:00 PM PST.',
      browserTimezone: 'America/Los_Angeles',
      expectedTimezone: 'America/Los_Angeles'
    },
    {
      name: 'Event with EST timezone',
      text: 'Annual Meeting on February 20, 2026 at 10:00 AM EST in New York City.',
      browserTimezone: 'America/New_York',
      expectedTimezone: 'America/New_York'
    },
    {
      name: 'Event without timezone (should use browser timezone)',
      text: 'Workshop on March 10, 2026 at 3:00 PM in Chicago.',
      browserTimezone: 'America/Chicago',
      expectedTimezone: 'America/Chicago'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`   Browser timezone: ${testCase.browserTimezone}`);
    console.log(`   Text: "${testCase.text}"`);

    try {
      const response = await fetch('https://grabcal.com/api/extract-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: testCase.text,
          browserTimezone: testCase.browserTimezone
        }),
      });

      const html = await response.text();

      // Check if event was found
      if (html.includes('No Event Found')) {
        console.log('   ❌ No event found');
        continue;
      }

      // Extract the Google Calendar URL to check timezone
      const googleUrlMatch = html.match(/https:\/\/calendar\.google\.com\/calendar\/render\?[^"]+/);
      if (googleUrlMatch) {
        const url = googleUrlMatch[0];
        const urlObj = new URL(url);
        const ctz = urlObj.searchParams.get('ctz');
        const dates = urlObj.searchParams.get('dates');

        console.log(`   ✅ Event found!`);
        console.log(`   Timezone in URL (ctz): ${ctz || 'NOT SET'}`);
        console.log(`   Dates parameter: ${dates}`);

        // Check if dates are in UTC (ending with Z) or local time
        if (dates && dates.includes('Z')) {
          console.log(`   ⚠️  WARNING: Dates are in UTC format (ending with Z)`);
        } else if (dates) {
          console.log(`   ✅ Dates are in local time format (no Z)`);
        }

        if (ctz === testCase.expectedTimezone) {
          console.log(`   ✅ Timezone matches expected: ${testCase.expectedTimezone}`);
        } else {
          console.log(`   ❌ Timezone mismatch! Expected: ${testCase.expectedTimezone}, Got: ${ctz}`);
        }
      } else {
        console.log('   ❌ Could not find Google Calendar URL in response');
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n✅ Timezone testing complete!');
}

testTimezone().catch(console.error);


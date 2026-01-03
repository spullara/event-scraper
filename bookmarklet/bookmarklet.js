(function() {
  'use strict';

  const API_URL = 'https://grabcal.com/api/extract-event';

  // Function to extract structured event data
  function extractStructuredData() {
    let eventData = [];
    
    // 1. Try Schema.org JSON-LD
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        const events = Array.isArray(data) ? data : [data];
        events.forEach(item => {
          if (item['@type'] === 'Event' || (Array.isArray(item['@type']) && item['@type'].includes('Event'))) {
            eventData.push(JSON.stringify(item));
          }
        });
      } catch (e) {
        console.error('Error parsing JSON-LD:', e);
      }
    });
    
    // 2. Try Schema.org Microdata
    const microdataEvents = document.querySelectorAll('[itemtype*="schema.org/Event"]');
    microdataEvents.forEach(elem => {
      eventData.push(elem.textContent);
    });
    
    // 3. Try Open Graph tags
    const ogTags = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
      ogTags[meta.getAttribute('property')] = meta.getAttribute('content');
    });
    if (Object.keys(ogTags).length > 0) {
      eventData.push(JSON.stringify(ogTags));
    }
    
    // 4. Try hCalendar microformat
    const hCalendarEvents = document.querySelectorAll('.vevent, .hcalendar');
    hCalendarEvents.forEach(elem => {
      eventData.push(elem.textContent);
    });
    
    return eventData.join('\n\n');
  }
  
  // Function to extract plain text as fallback
  function extractPlainText() {
    // Get the main content, avoiding scripts, styles, and navigation
    const clone = document.body.cloneNode(true);

    // Remove unwanted elements
    clone.querySelectorAll('script, style, nav, header, footer, iframe, noscript').forEach(el => el.remove());

    return clone.textContent.trim().replace(/\s+/g, ' ').substring(0, 10000); // Limit to 10k chars
  }

  // Main execution
  async function main() {
    console.log('GrabCal - Starting event extraction...');

    // Try structured data first
    let structuredData = extractStructuredData();
    let content = '';
    let extractionMethod = '';

    if (structuredData && structuredData.trim().length > 0) {
      content = structuredData;
      extractionMethod = 'structured data';
    } else {
      content = extractPlainText();
      extractionMethod = 'plain text';
    }

    if (!content || content.trim().length === 0) {
      alert('GrabCal: No content found on this page.');
      return;
    }

    // Log what we're sending for debugging
    console.log('GrabCal - Extraction method:', extractionMethod);
    console.log('GrabCal - Content length:', content.length, 'characters');
    console.log('GrabCal - Content preview:', content.substring(0, 500));
    console.log('GrabCal - Full content:', content);

    // Use form submission to bypass CSP restrictions
    // This works on all sites, including those with strict CSP
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = API_URL;
    form.target = 'GrabCal';
    form.style.display = 'none';

    // Add text data
    const textInput = document.createElement('input');
    textInput.type = 'hidden';
    textInput.name = 'text';
    textInput.value = content;
    form.appendChild(textInput);

    // Add timezone data
    const tzInput = document.createElement('input');
    tzInput.type = 'hidden';
    tzInput.name = 'browserTimezone';
    tzInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
    form.appendChild(tzInput);

    document.body.appendChild(form);

    // Open popup window
    const popup = window.open('', 'GrabCal', 'width=600,height=700,scrollbars=yes,resizable=yes');

    if (!popup) {
      alert('GrabCal: Please allow popups for this site to use GrabCal.');
      form.remove();
      return;
    }

    // Show loading state in popup
    popup.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>GrabCal - Loading...</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .loading {
            text-align: center;
            padding: 50px 20px;
          }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #4285f4;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="loading">
          <div class="spinner"></div>
          <p>Extracting event information...</p>
        </div>
      </body>
      </html>
    `);

    // Submit the form to the popup
    form.submit();

    // Clean up the form
    setTimeout(() => form.remove(), 1000);
  }

  main();
})();


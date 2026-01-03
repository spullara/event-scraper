(function() {
  'use strict';
  
  const API_URL = 'https://event-scraper-eight.vercel.app/api/extract-event'; // Will be updated for production
  
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
  
  // Function to show loading popup
  function showLoadingPopup() {
    const popup = window.open('', 'EventScraperPopup', 'width=550,height=600,scrollbars=yes');
    if (!popup) {
      alert('Please allow popups for this site to use the Event Scraper bookmarklet.');
      return null;
    }
    
    popup.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            padding: 20px;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .loading {
            text-align: center;
          }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #4285f4;
            border-radius: 50%;
            width: 40px;
            height: 40px;
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
    
    return popup;
  }
  
  // Main execution
  async function main() {
    // Extract content
    let content = extractStructuredData();
    
    // Fallback to plain text if no structured data found
    if (!content || content.trim().length === 0) {
      content = extractPlainText();
    }
    
    if (!content || content.trim().length === 0) {
      alert('No content found on this page.');
      return;
    }
    
    // Show loading popup
    const popup = showLoadingPopup();
    if (!popup) return;
    
    try {
      // Call API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Display result in popup
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      
    } catch (error) {
      console.error('Error:', error);
      popup.document.open();
      popup.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 20px; }
            .error { background: #fee; border: 1px solid #fcc; padding: 15px; border-radius: 8px; color: #c33; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>Error</h2>
            <p>${error.message}</p>
          </div>
        </body>
        </html>
      `);
      popup.document.close();
    }
  }
  
  main();
})();


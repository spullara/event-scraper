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
  
  // Function to create and show modal
  function createModal() {
    // Remove existing modal if any
    const existing = document.getElementById('event-scraper-modal');
    if (existing) existing.remove();

    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'event-scraper-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    `;

    // Create modal content container
    const modalContent = document.createElement('div');
    modalContent.id = 'event-scraper-modal-content';
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      position: relative;
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    return modalContent;
  }

  // Function to show loading state
  function showLoading(container) {
    container.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div style="
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4285f4;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: event-scraper-spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <p style="margin: 0; color: #666;">Extracting event information...</p>
        <style>
          @keyframes event-scraper-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;
  }

  // Function to show error
  function showError(container, message) {
    container.innerHTML = `
      <div style="padding: 30px;">
        <div style="background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px;">
          <h2 style="margin: 0 0 10px 0; color: #c33; font-size: 20px;">Error</h2>
          <p style="margin: 0 0 10px 0; color: #666;">${message}</p>
          <p style="margin: 10px 0 0 0; color: #999; font-size: 13px;">
            💡 Check the browser console (F12) for debugging information
          </p>
        </div>
        <button onclick="document.getElementById('event-scraper-modal').remove()" style="
          margin-top: 20px;
          width: 100%;
          padding: 12px;
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
        ">Close</button>
      </div>
    `;
  }
  
  // Main execution
  async function main() {
    // Extract content
    let content = extractStructuredData();
    let extractionMethod = 'structured data';

    // Fallback to plain text if no structured data found
    if (!content || content.trim().length === 0) {
      content = extractPlainText();
      extractionMethod = 'plain text';
    }

    if (!content || content.trim().length === 0) {
      alert('No content found on this page.');
      return;
    }

    // Log what we're sending for debugging
    console.log('Event Scraper - Extraction method:', extractionMethod);
    console.log('Event Scraper - Content length:', content.length, 'characters');
    console.log('Event Scraper - Content preview:', content.substring(0, 500));
    console.log('Event Scraper - Full content:', content);

    // Create modal and show loading
    const modalContent = createModal();
    showLoading(modalContent);

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

      // Log response for debugging
      console.log('Event Scraper - API response length:', html.length, 'characters');
      if (html.includes('No Event Found') || html.includes('event-scraper-error')) {
        console.log('Event Scraper - No event found in response');
        console.log('Event Scraper - Response HTML:', html);
      } else {
        console.log('Event Scraper - Event(s) found successfully');
      }

      // Display result in modal
      modalContent.innerHTML = html;

      // Add close button functionality to any existing close buttons in the response
      const closeButtons = modalContent.querySelectorAll('[data-close-modal]');
      closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('event-scraper-modal').remove();
        });
      });

    } catch (error) {
      console.error('Event Scraper - Error:', error);
      console.error('Event Scraper - Error details:', error.message);
      showError(modalContent, error.message);
    }
  }

  main();
})();


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

  // Function to create and show modal
  function createModal() {
    // Remove existing modal if any
    const existing = document.getElementById('grabcal-modal');
    if (existing) existing.remove();

    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'grabcal-modal';
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
    modalContent.id = 'grabcal-modal-content';
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
          animation: grabcal-spin 1s linear infinite;
          margin: 0 auto 20px;
        "></div>
        <p style="margin: 0; color: #666;">Extracting event information...</p>
        <style>
          @keyframes grabcal-spin {
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
        <button onclick="document.getElementById('grabcal-modal').remove()" style="
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
    console.log('GrabCal - Starting event extraction...');

    // Create modal and show loading
    const modalContent = createModal();
    showLoading(modalContent);

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
      document.getElementById('grabcal-modal').remove();
      return;
    }

    // Log what we're sending for debugging
    console.log('GrabCal - Extraction method:', extractionMethod);
    console.log('GrabCal - Content length:', content.length, 'characters');
    console.log('GrabCal - Content preview:', content.substring(0, 500));
    console.log('GrabCal - Full content:', content);

    try {
      // Try fetch first (works on most sites)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: content,
          browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const html = await response.text();
      console.log('GrabCal - API response received');

      // Display result in modal
      modalContent.innerHTML = html;

      // Add close button functionality
      const closeButtons = modalContent.querySelectorAll('[data-close-modal]');
      closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('grabcal-modal').remove();
        });
      });

    } catch (error) {
      console.error('GrabCal - Fetch failed:', error);
      console.log('GrabCal - Falling back to form submission (CSP bypass)');

      // Remove modal
      const modal = document.getElementById('grabcal-modal');
      if (modal) modal.remove();

      // Fall back to form submission to bypass CSP
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
        alert('GrabCal: Please allow popups for this site. This site has security restrictions that prevent the modal from working.');
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
  }

  main();
})();


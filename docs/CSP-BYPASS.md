# Content Security Policy (CSP) Bypass Strategy

## Problem

Some websites (like Steam, GitHub, Shopify, etc.) implement strict Content Security Policy headers that block:
- `fetch()` and `XMLHttpRequest` to external domains
- Loading iframes from external domains (`frame-src` directive)
- Inline scripts from bookmarklets

This prevents the bookmarklet from making API calls to extract event information.

## Solution: Hybrid Approach with Automatic Fallback

### Primary Method: Fetch with In-Page Modal (Preferred)
**On most sites:**
- Use standard `fetch()` API to call the event extraction endpoint
- Display results in a clean in-page modal overlay
- Best user experience - no popup needed

### Fallback Method: Form Submission to Popup Window
**When fetch fails (CSP-restricted sites):**
- Automatically detect fetch failure
- Create a hidden HTML form with POST method
- Set form target to a popup window
- Submit form data (not JSON) to the API
- Form submissions bypass CSP `connect-src` restrictions

**Why the fallback works:**
- Form submissions are considered navigation, not fetch/XHR
- CSP `connect-src` doesn't apply to form submissions
- The popup window receives the API response as HTML
- Works on **all** websites, regardless of CSP policy

## Implementation Details

### Bookmarklet Code

```javascript
try {
  // Try fetch first (works on most sites)
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: content,
      browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }),
  });

  const html = await response.text();

  // Display in modal
  modalContent.innerHTML = html;

} catch (error) {
  // Fetch failed - fall back to form submission
  console.log('Falling back to form submission (CSP bypass)');

  // Remove modal
  document.getElementById('grabcal-modal').remove();

  // Create form
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = API_URL;
  form.target = 'GrabCal';
  form.style.display = 'none';

  // Add hidden inputs
  const textInput = document.createElement('input');
  textInput.type = 'hidden';
  textInput.name = 'text';
  textInput.value = content;
  form.appendChild(textInput);

  const tzInput = document.createElement('input');
  tzInput.type = 'hidden';
  tzInput.name = 'browserTimezone';
  tzInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  form.appendChild(tzInput);

  document.body.appendChild(form);

  // Open popup window
  const popup = window.open('', 'GrabCal', 'width=600,height=700');

  if (!popup) {
    alert('Please allow popups for this site.');
    form.remove();
    return;
  }

  // Show loading state in popup
  popup.document.write('...loading HTML...');

  // Submit form to popup
  form.submit();

  // Clean up
  setTimeout(() => form.remove(), 1000);
}
```

### API Changes

The API must handle both JSON and form-encoded data:

```javascript
// Disable automatic body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

// Manually parse both formats
const rawBody = await readBody(req);
const contentType = req.headers['content-type'] || '';

if (contentType.includes('application/json')) {
  const parsed = JSON.parse(rawBody);
  text = parsed.text;
} else {
  // Form-encoded
  const params = new URLSearchParams(rawBody);
  text = params.get('text');
}
```

## User Experience

### On Normal Sites (90%+ of websites)
- ✅ Clean in-page modal overlay appears
- ✅ No popup blockers triggered
- ✅ Best UX - no separate window needed
- ✅ Click outside modal to close

### On CSP-Restricted Sites (Steam, Shopify, etc.)
- ✅ Automatically falls back to popup window
- ⚠️ User may need to allow popups once (browser will remember)
- ✅ Works on **all** websites, regardless of CSP
- ✅ Clear error message if popups blocked
- ✅ Same functionality, just in a separate window

## Testing

### Test Pages Included

1. **`tests/test-csp-fallback.html`**
   - Strict CSP: `connect-src 'none'; frame-src 'none'`
   - Tests form submission with popup
   - Includes structured event data

2. **`tests/test-form-submit.html`**
   - Tests form submission directly
   - Verifies API handles form-encoded data

### Manual Testing

Tested successfully on real sites with strict CSP:
- ✅ Steam Community (very strict CSP)
- ✅ Shopify stores (blocks iframes)
- ✅ GitHub
- ✅ Twitter/X
- ✅ Facebook

## Security Considerations

### Why This is Safe

1. **User-Initiated**: Bookmarklet only runs when user clicks it
2. **Same-Origin API**: Form submits to our own domain (grabcal.com)
3. **No Data Leakage**: Page content only sent to our API
4. **Popup Consent**: User must allow popups (browser protection)

### What We Don't Do

- ❌ Don't inject scripts into the page
- ❌ Don't modify page CSP headers
- ❌ Don't use browser extensions
- ❌ Don't require user to disable security features

## Alternative Approaches Considered

### ❌ Browser Extension
- **Pro**: Full access, no CSP issues
- **Con**: Requires installation, store approval, maintenance

### ❌ Proxy Server
- **Pro**: Could relay requests
- **Con**: Privacy concerns, latency, complexity

### ❌ Data URI / Blob URL
- **Pro**: No external requests
- **Con**: Can't make API calls, limited functionality

### ❌ Iframe with postMessage
- **Pro**: Could work on some sites
- **Con**: Blocked by `frame-src` CSP directive on many sites (Steam, Shopify, etc.)

### ✅ Hybrid: Fetch with Form Submission Fallback (Chosen)
- **Pro**: Best UX on normal sites (in-page modal), works on **all** sites (popup fallback), no installation, respects security
- **Con**: Requires popup window on CSP-restricted sites (but browsers remember popup permission)

## Future Improvements

1. **Better UX**: Show message explaining popup before opening (first time only)
2. **Remember Preference**: Store user's popup permission in localStorage to avoid showing message again
3. **Retry Logic**: If no event found with structured data, automatically retry with plain text in the same popup

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [W3C CSP Level 3](https://www.w3.org/TR/CSP3/)
- [Stack Overflow: Bookmarklet CSP Workarounds](https://stackoverflow.com/questions/19822716/javascript-bookmarklet-on-site-with-csp-in-firefox)


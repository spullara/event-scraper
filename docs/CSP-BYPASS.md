# Content Security Policy (CSP) Bypass Strategy

## Problem

Some websites (like Steam, GitHub, Shopify, etc.) implement strict Content Security Policy headers that block:
- `fetch()` and `XMLHttpRequest` to external domains
- Loading iframes from external domains (`frame-src` directive)
- Inline scripts from bookmarklets

This prevents the bookmarklet from making API calls to extract event information.

## Solution: Form Submission to Popup Window

**Strategy:** Use HTML form submission instead of fetch/XHR
- Create a hidden HTML form with POST method
- Set form target to a popup window
- Submit form data (not JSON) to the API
- Form submissions bypass CSP `connect-src` and `frame-src` restrictions

**Why it works:**
- Form submissions are considered navigation, not fetch/XHR
- CSP `connect-src` doesn't apply to form submissions
- CSP `frame-src` doesn't apply to popup windows
- The popup window receives the API response as HTML
- Works on **all** websites, regardless of CSP policy

## Implementation Details

### Bookmarklet Code

```javascript
// Create form
const form = document.createElement('form');
form.method = 'POST';
form.action = 'https://grabcal.com/api/extract-event';
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
const popup = window.open('', 'GrabCal', 'width=600,height=700,scrollbars=yes,resizable=yes');

if (!popup) {
  alert('Please allow popups for this site to use GrabCal.');
  form.remove();
  return;
}

// Show loading state in popup
popup.document.write('...loading HTML...');

// Submit form to popup
form.submit();

// Clean up
setTimeout(() => form.remove(), 1000);
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

### On All Sites
- ✅ Popup window opens with event information
- ⚠️ User may need to allow popups once (browser will remember)
- ✅ Works on **all** websites, regardless of CSP
- ✅ Clear error message if popups blocked
- ✅ Same functionality as a modal, just in a separate window

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

### ❌ In-page Modal with fetch()
- **Pro**: Best UX, no popup needed
- **Con**: Blocked by `connect-src` CSP directive on many sites

### ✅ Form Submission to Popup (Chosen)
- **Pro**: Works on **all** sites, no installation, respects security, bypasses both `connect-src` and `frame-src`
- **Con**: Requires popup window (but browsers remember popup permission)

## Future Improvements

1. **Better UX**: Show message explaining popup before opening (first time only)
2. **Remember Preference**: Store user's popup permission in localStorage to avoid showing message again
3. **Retry Logic**: If no event found with structured data, automatically retry with plain text in the same popup

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [W3C CSP Level 3](https://www.w3.org/TR/CSP3/)
- [Stack Overflow: Bookmarklet CSP Workarounds](https://stackoverflow.com/questions/19822716/javascript-bookmarklet-on-site-with-csp-in-firefox)


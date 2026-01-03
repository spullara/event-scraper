# Content Security Policy (CSP) Bypass Strategy

## Problem

Some websites (like Steam, GitHub, etc.) implement strict Content Security Policy headers that block:
- `fetch()` and `XMLHttpRequest` to external domains
- Loading iframes from external domains
- Inline scripts from bookmarklets

This prevents the bookmarklet from making API calls to extract event information.

## Solution: Multi-Layer Fallback Strategy

### Layer 1: Iframe Fetch (Preferred)
**Attempt:** Create a hidden iframe pointing to `https://grabcal.com/fetch-helper.html`
- The iframe loads from the same domain as the API
- Uses `postMessage` to communicate between parent and iframe
- Iframe makes the fetch request in its own context

**Limitation:** Some CSP policies block iframe creation (`frame-src 'none'`)

### Layer 2: Form Submission to Popup (Fallback)
**When Layer 1 fails:** Automatically fall back to form submission
- Create a hidden HTML form with POST method
- Set form target to a popup window
- Submit form data (not JSON) to the API
- Form submissions bypass CSP `connect-src` restrictions

**Why it works:**
- Form submissions are considered navigation, not fetch/XHR
- CSP `connect-src` doesn't apply to form submissions
- The popup window receives the API response as HTML

## Implementation Details

### Bookmarklet Code

```javascript
try {
  // Try iframe fetch first
  const html = await fetchViaIframe(data);
  // Display in modal...
} catch (error) {
  // Fall back to form submission
  if (error.message.includes('Failed to fetch') || error.message.includes('CSP')) {
    // Create form
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://grabcal.com/api/extract-event';
    form.target = 'GrabCal';
    
    // Add hidden inputs
    const textInput = document.createElement('input');
    textInput.type = 'hidden';
    textInput.name = 'text';
    textInput.value = content;
    form.appendChild(textInput);
    
    // Open popup and submit
    window.open('', 'GrabCal', 'width=600,height=700');
    form.submit();
  }
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

### On Normal Sites
- ✅ Modal overlay appears (preferred UX)
- ✅ No popup blockers triggered
- ✅ Clean, in-page experience

### On Sites with Strict CSP
- ✅ Popup window opens automatically
- ⚠️ User may need to allow popups once
- ✅ Same functionality, different window
- ✅ Clear error message if popups blocked

## Testing

### Test Pages Included

1. **`tests/test-csp-fallback.html`**
   - Strict CSP: `connect-src 'none'; frame-src 'none'`
   - Tests automatic popup fallback
   - Includes structured event data

2. **`tests/test-form-submit.html`**
   - Tests form submission directly
   - Verifies API handles form-encoded data

3. **`tests/test-iframe-fetch.html`**
   - Tests iframe approach
   - Compares direct fetch vs iframe fetch

### Manual Testing

Test on real sites with strict CSP:
- ✅ Steam Community
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

### ✅ Form Submission (Chosen)
- **Pro**: Works everywhere, no installation, respects security
- **Con**: Requires popup window on strict CSP sites

## Future Improvements

1. **Detect CSP Early**: Check CSP headers before attempting fetch
2. **Better UX**: Show message explaining popup before opening
3. **Remember Preference**: Store user's popup permission in localStorage
4. **Progressive Enhancement**: Try multiple strategies in parallel

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [W3C CSP Level 3](https://www.w3.org/TR/CSP3/)
- [Stack Overflow: Bookmarklet CSP Workarounds](https://stackoverflow.com/questions/19822716/javascript-bookmarklet-on-site-with-csp-in-firefox)


# Debugging Guide for Event Scraper

## Console Logging

The Event Scraper bookmarklet now includes comprehensive console logging to help debug issues when events are not found.

### What Gets Logged

When you click the bookmarklet, the following information is logged to the browser console:

#### 1. Extraction Information
```
Event Scraper - Extraction method: structured data
Event Scraper - Content length: 1234 characters
Event Scraper - Content preview: {...first 500 characters...}
Event Scraper - Full content: {...complete extracted content...}
```

**Extraction methods:**
- `structured data` - Found Schema.org, Open Graph, or hCalendar markup
- `plain text` - No structured data found, extracted plain text from page

#### 2. API Response Information
```
Event Scraper - API response length: 2853 characters
Event Scraper - Event(s) found successfully
```

Or if no event was found:
```
Event Scraper - API response length: 1234 characters
Event Scraper - No event found in response
Event Scraper - Response HTML: <div>...</div>
```

#### 3. Error Information
If an error occurs:
```
Event Scraper - Error: API request failed: 500
Event Scraper - Error details: API request failed: 500
```

### How to Access the Console

**Chrome/Edge:**
- Press `F12` or `Ctrl+Shift+J` (Windows/Linux)
- Press `Cmd+Option+J` (Mac)

**Firefox:**
- Press `F12` or `Ctrl+Shift+K` (Windows/Linux)
- Press `Cmd+Option+K` (Mac)

**Safari:**
- Enable Developer menu: Preferences → Advanced → Show Develop menu
- Press `Cmd+Option+C`

### Debugging Workflow

1. **Open the browser console** (F12)
2. **Navigate to a page** with event information
3. **Click the bookmarklet**
4. **Check the console** for logged information

### Common Issues and Solutions

#### Issue: "No Event Found"

**Check the console for:**
1. **Extraction method**: 
   - If `plain text`, the page has no structured event markup
   - If `structured data`, check what was extracted

2. **Content preview/full content**:
   - Does it contain event information?
   - Is the date/time in a recognizable format?
   - Is the location included?

3. **API response**:
   - Check the error message in the response HTML
   - The AI might not recognize the content as an event

**Solutions:**
- Ensure the page actually contains event information
- Check if dates are in a clear format (e.g., "March 15, 2024 at 9:00 AM")
- Verify location and title are present
- Try a page with Schema.org markup for best results

#### Issue: API Timeout

**Console shows:**
```
Event Scraper - Error: The operation was aborted
```

**Solutions:**
- Check your internet connection
- The API has a 30-second timeout - very long content might timeout
- Try again - it might be a temporary issue

#### Issue: Network Error

**Console shows:**
```
Event Scraper - Error: Failed to fetch
```

**Solutions:**
- Check your internet connection
- Verify the API is accessible: https://event-scraper-eight.vercel.app/api/extract-event
- Check if you're behind a firewall or proxy

### Example Console Output

**Successful extraction:**
```
Event Scraper - Extraction method: structured data
Event Scraper - Content length: 847 characters
Event Scraper - Content preview: {"@context":"https://schema.org","@type":"Event","name":"Tech Innovation Summit 2026"...
Event Scraper - Full content: {"@context":"https://schema.org","@type":"Event","name":"Tech Innovation Summit 2026","startDate":"2026-03-15T09:00:00-07:00"...}
Event Scraper - API response length: 2853 characters
Event Scraper - Event(s) found successfully
```

**Failed extraction (no event found):**
```
Event Scraper - Extraction method: plain text
Event Scraper - Content length: 3421 characters
Event Scraper - Content preview: Welcome to our website. We offer various services including...
Event Scraper - Full content: Welcome to our website. We offer various services including consulting, development...
Event Scraper - API response length: 1234 characters
Event Scraper - No event found in response
Event Scraper - Response HTML: <div class="event-scraper-container">...</div>
```

### Reporting Issues

When reporting issues, please include:
1. The URL of the page you tried to scrape
2. The complete console output
3. A screenshot of the error modal (if applicable)
4. Your browser and version

### Tips for Best Results

1. **Use pages with structured data**: Pages with Schema.org markup work best
2. **Test with the sample page**: https://event-scraper-eight.vercel.app/test-event.html
3. **Check the page source**: Look for `<script type="application/ld+json">` tags
4. **Clear, formatted dates**: "March 15, 2024 at 9:00 AM" works better than "3/15/24 9am"
5. **Complete information**: Pages with title, date, time, and location work best

---

**Need more help?** Check the console logs first - they usually reveal what went wrong!


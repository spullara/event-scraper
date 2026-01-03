# Development Guide

## Bookmarklet Development Workflow

The bookmarklet code lives in `bookmarklet/bookmarklet.js` and needs to be synced to `public/index.html` before deployment.

### Making Changes to the Bookmarklet

1. **Edit the source file**: `bookmarklet/bookmarklet.js`
   - This is the main source of truth for the bookmarklet code
   - Write clean, readable code with comments
   - Test your logic here first

2. **Rebuild the HTML**: Run the rebuild script to sync the code to the HTML page
   ```bash
   node rebuild-html.js
   ```
   This script:
   - Reads `bookmarklet/bookmarklet.js`
   - Embeds it in `public/index.html` using JSON.stringify
   - Preserves formatting and escapes special characters

3. **Validate the code**: Run the validation script to check for errors
   ```bash
   node validate-bookmarklet.js
   ```
   This script checks:
   - ✅ Valid JavaScript syntax
   - ✅ Correct IIFE structure `(function() { ... })();`
   - ✅ All required functions present
   - ✅ Required constants defined
   - ✅ No duplicate code

4. **Test locally** (optional but recommended):
   - Start a local server: `python3 -m http.server 8000`
   - Open `http://localhost:8000/test-bookmarklet-local.html`
   - Click "Run Bookmarklet Test"
   - Check browser console (F12) for errors
   - Verify the modal appears and works correctly

5. **Commit and deploy**:
   ```bash
   git add -A
   git commit -m "Update bookmarklet: [description]"
   vercel --prod
   git push origin master
   ```

### Scripts

#### `rebuild-html.js`
Syncs the bookmarklet code from `bookmarklet/bookmarklet.js` to `public/index.html`.

**Usage:**
```bash
node rebuild-html.js
```

**What it does:**
- Reads the source bookmarklet file
- Uses JSON.stringify to properly escape the code
- Replaces the `<script>` section in the HTML
- Preserves all formatting and special characters

#### `validate-bookmarklet.js`
Validates the bookmarklet code embedded in the HTML.

**Usage:**
```bash
node validate-bookmarklet.js
```

**Checks:**
- JavaScript syntax validity
- IIFE structure (should have exactly one `})();`)
- Required functions: `extractStructuredData`, `extractPlainText`, `createModal`, `showLoading`, `showError`, `main`
- Required constants: `API_URL`

**Exit codes:**
- `0` - All checks passed
- `1` - Validation failed

#### `update-bookmarklet-url.js`
Updates the API URL in both the bookmarklet source and the HTML.

**Usage:**
```bash
node update-bookmarklet-url.js <production-url>
```

**Example:**
```bash
node update-bookmarklet-url.js https://event-scraper-eight.vercel.app
```

### Testing

#### Local Testing
Use `test-bookmarklet-local.html` to test the bookmarklet before deployment:

1. Start a local server
2. Open the test page in your browser
3. Click "Run Bookmarklet Test"
4. Check the console for errors
5. Verify the modal works correctly

#### Production Testing
After deployment, test on the live site:

1. Visit https://event-scraper-eight.vercel.app
2. Drag the bookmarklet to your bookmarks bar
3. Go to https://event-scraper-eight.vercel.app/test-event.html
4. Click the bookmarklet
5. Verify the event is extracted correctly

### Common Issues

#### Issue: Syntax Error in Bookmarklet

**Symptom:** `Uncaught SyntaxError: Unexpected token`

**Solution:**
1. Run `node validate-bookmarklet.js` to identify the error
2. Fix the error in `bookmarklet/bookmarklet.js`
3. Run `node rebuild-html.js` to sync
4. Run `node validate-bookmarklet.js` again to verify

#### Issue: Duplicate Code in HTML

**Symptom:** Multiple `})();` closures, code appears twice

**Solution:**
1. Run `node rebuild-html.js` - it will completely replace the script section
2. Run `node validate-bookmarklet.js` to verify

#### Issue: API URL Not Updated

**Symptom:** Bookmarklet calls localhost instead of production

**Solution:**
```bash
node update-bookmarklet-url.js https://event-scraper-eight.vercel.app
node rebuild-html.js
node validate-bookmarklet.js
```

### Best Practices

1. **Always validate before committing**: Run `validate-bookmarklet.js` before every commit
2. **Test locally first**: Use the test page to catch errors early
3. **Keep source clean**: Write readable code in `bookmarklet/bookmarklet.js`, the rebuild script handles minification
4. **Console logging**: Use `console.log('Event Scraper - ...')` prefix for all logs to make debugging easier
5. **Error handling**: Always include try-catch blocks and user-friendly error messages

### File Structure

```
event-scraper/
├── bookmarklet/
│   └── bookmarklet.js          # Source of truth for bookmarklet code
├── public/
│   ├── index.html              # Installation page (contains embedded bookmarklet)
│   └── test-event.html         # Test page with event markup
├── rebuild-html.js             # Sync bookmarklet to HTML
├── validate-bookmarklet.js     # Validate bookmarklet code
├── update-bookmarklet-url.js   # Update API URLs
└── test-bookmarklet-local.html # Local testing page
```

### Deployment Checklist

Before deploying to production:

- [ ] Edit `bookmarklet/bookmarklet.js`
- [ ] Run `node rebuild-html.js`
- [ ] Run `node validate-bookmarklet.js` (must pass)
- [ ] Test locally with `test-bookmarklet-local.html` (optional)
- [ ] Commit changes
- [ ] Deploy with `vercel --prod`
- [ ] Push to GitHub
- [ ] Test on production site

---

**Remember:** The bookmarklet code in `public/index.html` is auto-generated. Always edit `bookmarklet/bookmarklet.js` and run `rebuild-html.js` to sync!


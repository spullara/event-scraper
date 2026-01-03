# GrabCal - Event Scraper

A bookmarklet and API service that extracts event information from web pages and generates calendar links.

**Live at: https://grabcal.com**

## Features

- 📅 **Smart Event Detection**: Automatically detects structured event data (Schema.org, Open Graph, hCalendar)
- 🤖 **AI-Powered Fallback**: Uses Gemini 2.0 Flash to extract events from plain text when structured data isn't available
- 🌍 **Timezone Aware**: Preserves event timezones from the page or uses browser timezone
- 📱 **Multiple Calendar Formats**: Generates both Google Calendar URLs and ICS files
- 🎯 **Multiple Events Support**: Handles pages with multiple events (up to 5)
- ⚡ **Fast & Simple**: One-click extraction with clean, in-page modal UI
- 🔄 **Smart Retry**: Tries structured data first, falls back to plain text if no events found

## How It Works

1. **Bookmarklet** extracts content from the current page:
   - First looks for structured event markup (JSON-LD, Microdata, Open Graph, hCalendar)
   - If no events found in structured data, retries with plain text extraction
   - Sends browser timezone for accurate time handling

2. **API** processes the content:
   - Uses Gemini 2.0 Flash Experimental with structured outputs
   - Extracts event details (title, date, location, description, timezone)
   - Preserves timezone information instead of converting to UTC
   - Returns HTML with calendar links

3. **Modal** displays results:
   - Shows event details in an in-page overlay
   - Provides Google Calendar and ICS download links
   - Handles multiple events with selection UI
   - Includes debugging console logs

## Setup

### Prerequisites

- Node.js 18+
- Vercel account (for deployment)
- Google Gemini API key

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/spullara/event-scraper.git
cd event-scraper
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with your Gemini API key:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open `http://localhost:3000` to see the bookmarklet installation page

### Testing Locally

1. Visit `http://localhost:3000` and drag the bookmarklet to your bookmarks bar
2. Navigate to any page with event information
3. Click the bookmarklet to test

## Deployment

The application is deployed at **https://grabcal.com** using Vercel and AWS Route 53.

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Set environment variable in Vercel dashboard:
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google Gemini API key

4. The bookmarklet will automatically use the production domain

### Custom Domain Setup

See [DOMAIN-SETUP.md](DOMAIN-SETUP.md) for details on the domain configuration with AWS Route 53 and Vercel.

## Project Structure

```
event-scraper/
├── api/
│   └── extract-event.js       # Vercel serverless API endpoint
├── bookmarklet/
│   └── bookmarklet.js          # Bookmarklet source code
├── public/
│   ├── index.html              # Bookmarklet installation page
│   └── test-event.html         # Test page with event markup
├── scripts/
│   ├── rebuild-html.js         # Sync bookmarklet to HTML
│   ├── validate-bookmarklet.js # Validate bookmarklet code
│   ├── check-ssl.sh            # Check SSL certificate status
│   └── add-domain-to-vercel.sh # Domain setup helper
├── tests/
│   ├── test-api.js             # API endpoint tests
│   ├── test-production.js      # Production deployment test
│   ├── test-timezone.js        # Timezone handling tests
│   ├── test-multiple-events.js # Multiple events test
│   └── test-*.js               # Other test files
├── package.json                # Dependencies
├── vercel.json                 # Vercel configuration
├── SPEC.md                     # Original specification
├── DOMAIN-SETUP.md             # Domain configuration guide
└── README.md                   # This file
```

## Development

### Making Changes to the Bookmarklet

1. Edit `bookmarklet/bookmarklet.js`
2. Run `node scripts/rebuild-html.js` to sync to HTML
3. Run `node scripts/validate-bookmarklet.js` to validate
4. Test locally at `http://localhost:3000`
5. Deploy with `vercel --prod`

### Running Tests

```bash
# Test API endpoint
node tests/test-api.js

# Test production deployment
node tests/test-production.js

# Test timezone handling
node tests/test-timezone.js

# Test multiple events
node tests/test-multiple-events.js
```

## API Endpoint

### POST /api/extract-event

**Request:**
```json
{
  "text": "extracted page content",
  "browserTimezone": "America/Los_Angeles"
}
```

**Response:**
HTML content to display in modal (includes event details and calendar links with timezone preservation)

## Technologies

- **Frontend**: Vanilla JavaScript bookmarklet
- **Backend**: Vercel Serverless Functions
- **AI**: Vercel AI SDK + Google Gemini 2.0 Flash Experimental
- **Deployment**: Vercel + AWS Route 53
- **Domain**: grabcal.com

## License

MIT


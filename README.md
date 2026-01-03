# Event Scraper

A bookmarklet and API service that extracts event information from web pages and generates calendar links.

## Features

- 📅 **Smart Event Detection**: Automatically detects structured event data (Schema.org, Open Graph, hCalendar)
- 🤖 **AI-Powered Fallback**: Uses Gemini AI to extract events from plain text when structured data isn't available
- 📱 **Multiple Calendar Formats**: Generates both Google Calendar URLs and ICS files
- 🎯 **Multiple Events Support**: Handles pages with multiple events (up to 5)
- ⚡ **Fast & Simple**: One-click extraction with clean, simple UI

## How It Works

1. **Bookmarklet** extracts content from the current page:
   - First looks for structured event markup (JSON-LD, Microdata, Open Graph, hCalendar)
   - Falls back to plain text extraction if no structured data found
   
2. **API** processes the content:
   - Uses Gemini 2.0 Flash with structured outputs
   - Extracts event details (title, date, location, description)
   - Returns HTML with calendar links

3. **Popup** displays results:
   - Shows event details
   - Provides Google Calendar and ICS download links
   - Handles multiple events with selection UI

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
GEMINI_API_KEY=your_api_key_here
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

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variable in Vercel dashboard:
   - `GEMINI_API_KEY`: Your Google Gemini API key

4. Update the bookmarklet URL in `public/index.html` to use your production URL

## Project Structure

```
event-scraper/
├── api/
│   └── extract-event.js    # Vercel serverless function
├── bookmarklet/
│   └── bookmarklet.js       # Bookmarklet source code
├── public/
│   └── index.html           # Bookmarklet installation page
├── package.json
├── vercel.json
└── README.md
```

## API Endpoint

### POST /api/extract-event

**Request:**
```json
{
  "text": "extracted page content"
}
```

**Response:**
HTML content to display in popup (includes event details and calendar links)

## Technologies

- **Frontend**: Vanilla JavaScript bookmarklet
- **Backend**: Vercel Serverless Functions
- **AI**: Vercel AI SDK + Google Gemini 2.0 Flash
- **Deployment**: Vercel

## License

MIT


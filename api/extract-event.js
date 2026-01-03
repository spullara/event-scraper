import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for event data
const eventSchema = z.object({
  title: z.string(),
  startDate: z.string().describe('ISO 8601 date-time string with timezone if available'),
  endDate: z.string().optional().describe('ISO 8601 date-time string with timezone if available'),
  location: z.string().optional(),
  description: z.string().optional(),
  timezone: z.string().optional().describe('IANA timezone name (e.g., America/Los_Angeles, America/New_York) or timezone abbreviation (e.g., PST, EST)'),
});

const responseSchema = z.object({
  status: z.enum(['success', 'error', 'multiple']),
  message: z.string().optional(),
  events: z.array(eventSchema).optional(),
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, browserTimezone } = req.body;

    if (!text) {
      return res.status(400).send(generateErrorHTML('No text provided'));
    }

    console.log('Browser timezone:', browserTimezone);

    // Use Gemini to extract event information
    const result = await generateObject({
      model: google('gemini-2.5-flash-lite', {
        structuredOutputs: true,
      }),
      schema: responseSchema,
      prompt: `Extract event information from the following text.

If you find exactly one event, return status "success" with the event details.
If you find multiple events (up to 5), return status "multiple" with an array of events.
If no event is found, return status "error" with an appropriate message.

For dates:
- Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
- If a timezone is mentioned (e.g., PST, EST, PDT, America/Los_Angeles), include it in the timezone field as an IANA timezone name
- If no timezone is mentioned in the text, use this browser timezone: ${browserTimezone || 'UTC'}
- Do NOT convert times to UTC - keep them in the original timezone mentioned
- If no time is specified, use 00:00:00
- If no end date is specified, leave it empty

Text to analyze:
${text}`,
    });

    const data = result.object;

    // Generate HTML response based on status
    if (data.status === 'error') {
      return res.status(200).send(generateErrorHTML(data.message || 'No event found'));
    }

    if (data.status === 'success' && data.events && data.events.length > 0) {
      return res.status(200).send(generateSuccessHTML(data.events[0]));
    }

    if (data.status === 'multiple' && data.events && data.events.length > 0) {
      return res.status(200).send(generateMultipleHTML(data.events.slice(0, 5)));
    }

    return res.status(200).send(generateErrorHTML('Unable to process events'));

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(200).send(generateErrorHTML(`Error: ${error.message}`));
  }
}

function generateGoogleCalendarURL(event) {
  const baseURL = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: formatDateForGoogle(event.startDate, event.endDate, event.timezone),
  });

  if (event.location) {
    params.append('location', event.location);
  }

  if (event.description) {
    params.append('details', event.description);
  }

  if (event.timezone) {
    params.append('ctz', event.timezone);
  }

  return `${baseURL}?${params.toString()}`;
}

function formatDateForGoogle(startDate, endDate, timezone) {
  const formatDate = (dateStr) => {
    // Parse the date string - it should be in local time, not UTC
    const date = new Date(dateStr);

    // Format as YYYYMMDDTHHmmss without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };

  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : formatDate(new Date(new Date(startDate).getTime() + 3600000).toISOString());

  return `${start}/${end}`;
}

function generateICS(event) {
  const formatICSDate = (dateStr) => {
    const date = new Date(dateStr);

    // Format as YYYYMMDDTHHmmss without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };

  const start = formatICSDate(event.startDate);
  const end = event.endDate ? formatICSDate(event.endDate) : formatICSDate(new Date(new Date(event.startDate).getTime() + 3600000).toISOString());

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event Scraper//EN
BEGIN:VEVENT
DTSTART:${start}
DTEND:${end}
SUMMARY:${event.title}
${event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : ''}
${event.location ? `LOCATION:${event.location}` : ''}
${event.timezone ? `TZID:${event.timezone}` : ''}
END:VEVENT
END:VCALENDAR`;

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

function generateSuccessHTML(event) {
  const googleURL = generateGoogleCalendarURL(event);
  const icsURL = generateICS(event);

  return `
<style>
  .event-scraper-container { padding: 30px; }
  .event-scraper-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .event-scraper-header h2 { margin: 0; font-size: 22px; color: #333; }
  .event-scraper-close { background: none; border: none; font-size: 28px; color: #999; cursor: pointer; padding: 0; width: 32px; height: 32px; line-height: 1; }
  .event-scraper-close:hover { color: #333; }
  .event-scraper-details { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
  .event-scraper-details p { margin: 8px 0; font-size: 14px; color: #666; line-height: 1.5; }
  .event-scraper-details strong { color: #333; }
  .event-scraper-buttons { display: flex; gap: 10px; flex-direction: column; }
  .event-scraper-button { display: block; padding: 14px; text-align: center; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 15px; transition: all 0.2s; }
  .event-scraper-button-primary { background: #4285f4; color: white; }
  .event-scraper-button-secondary { background: #34a853; color: white; }
  .event-scraper-button:hover { opacity: 0.9; transform: translateY(-1px); }
</style>
<div class="event-scraper-container">
  <div class="event-scraper-header">
    <h2>📅 Event Found</h2>
    <button class="event-scraper-close" data-close-modal aria-label="Close">×</button>
  </div>
  <div class="event-scraper-details">
    <p><strong>Title:</strong> ${escapeHTML(event.title)}</p>
    <p><strong>Date:</strong> ${formatDisplayDate(event.startDate)}</p>
    ${event.endDate ? `<p><strong>End:</strong> ${formatDisplayDate(event.endDate)}</p>` : ''}
    ${event.location ? `<p><strong>Location:</strong> ${escapeHTML(event.location)}</p>` : ''}
    ${event.description ? `<p><strong>Description:</strong> ${escapeHTML(event.description)}</p>` : ''}
  </div>
  <div class="event-scraper-buttons">
    <a href="${googleURL}" target="_blank" class="event-scraper-button event-scraper-button-primary">Add to Google Calendar</a>
    <a href="${icsURL}" download="event.ics" class="event-scraper-button event-scraper-button-secondary">Download ICS File</a>
  </div>
</div>`;
}

function generateMultipleHTML(events) {
  const eventItems = events.map((event, index) => {
    const googleURL = generateGoogleCalendarURL(event);
    const icsURL = generateICS(event);

    return `
      <div class="event-scraper-item">
        <h3>${escapeHTML(event.title)}</h3>
        <p><strong>Date:</strong> ${formatDisplayDate(event.startDate)}</p>
        ${event.location ? `<p><strong>Location:</strong> ${escapeHTML(event.location)}</p>` : ''}
        <div class="event-scraper-item-buttons">
          <a href="${googleURL}" target="_blank" class="event-scraper-button event-scraper-button-primary">Add to Google Calendar</a>
          <a href="${icsURL}" download="event-${index}.ics" class="event-scraper-button event-scraper-button-secondary">Download ICS</a>
        </div>
      </div>
    `;
  }).join('');

  return `
<style>
  .event-scraper-container { padding: 30px; }
  .event-scraper-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .event-scraper-header h2 { margin: 0; font-size: 22px; color: #333; }
  .event-scraper-close { background: none; border: none; font-size: 28px; color: #999; cursor: pointer; padding: 0; width: 32px; height: 32px; line-height: 1; }
  .event-scraper-close:hover { color: #333; }
  .event-scraper-item { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 15px; }
  .event-scraper-item h3 { margin: 0 0 10px 0; font-size: 18px; color: #333; }
  .event-scraper-item p { margin: 5px 0; font-size: 14px; color: #666; }
  .event-scraper-item-buttons { display: flex; gap: 10px; margin-top: 12px; }
  .event-scraper-button { display: block; padding: 12px; text-align: center; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 13px; flex: 1; transition: all 0.2s; }
  .event-scraper-button-primary { background: #4285f4; color: white; }
  .event-scraper-button-secondary { background: #34a853; color: white; }
  .event-scraper-button:hover { opacity: 0.9; transform: translateY(-1px); }
</style>
<div class="event-scraper-container">
  <div class="event-scraper-header">
    <h2>📅 Multiple Events Found</h2>
    <button class="event-scraper-close" data-close-modal aria-label="Close">×</button>
  </div>
  ${eventItems}
</div>`;
}

function generateErrorHTML(message) {
  return `
<style>
  .event-scraper-container { padding: 30px; }
  .event-scraper-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .event-scraper-header h2 { margin: 0; font-size: 22px; color: #333; }
  .event-scraper-close { background: none; border: none; font-size: 28px; color: #999; cursor: pointer; padding: 0; width: 32px; height: 32px; line-height: 1; }
  .event-scraper-close:hover { color: #333; }
  .event-scraper-error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; color: #c33; }
  .event-scraper-error p { margin: 0 0 10px 0; font-size: 14px; line-height: 1.5; }
  .event-scraper-error p:last-child { margin: 10px 0 0 0; }
  .event-scraper-hint { color: #999; font-size: 13px; }
</style>
<div class="event-scraper-container">
  <div class="event-scraper-header">
    <h2>❌ No Event Found</h2>
    <button class="event-scraper-close" data-close-modal aria-label="Close">×</button>
  </div>
  <div class="event-scraper-error">
    <p>${escapeHTML(message)}</p>
    <p class="event-scraper-hint">💡 Check the browser console (F12) for debugging information</p>
  </div>
</div>`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDisplayDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

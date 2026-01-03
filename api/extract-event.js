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
If you find multiple events, return status "multiple" with an array of all events found.
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
      return res.status(200).send(generateMultipleHTML(data.events));
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
    // Extract date/time components directly from ISO string to preserve local time
    // Format: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ss±HH:mm
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);

    if (match) {
      const [, year, month, day, hours, minutes, seconds] = match;
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    }

    // Fallback: parse as Date (may have timezone issues)
    const date = new Date(dateStr);
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
    // Extract date/time components directly from ISO string to preserve local time
    // Format: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ss±HH:mm
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);

    if (match) {
      const [, year, month, day, hours, minutes, seconds] = match;
      return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    }

    // Fallback: parse as Date (may have timezone issues)
    const date = new Date(dateStr);
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
  .grabcal-container { padding: 30px; }
  .grabcal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .grabcal-header h2 { margin: 0; font-size: 22px; color: #333; }
  .grabcal-close { background: none; border: none; font-size: 28px; color: #999; cursor: pointer; padding: 0; width: 32px; height: 32px; line-height: 1; }
  .grabcal-close:hover { color: #333; }
  .grabcal-details { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
  .grabcal-details p { margin: 8px 0; font-size: 14px; color: #666; line-height: 1.5; }
  .grabcal-details strong { color: #333; }
  .grabcal-buttons { display: flex; gap: 10px; flex-direction: column; }
  .grabcal-button { display: block; padding: 14px; text-align: center; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 15px; transition: all 0.2s; }
  .grabcal-button-primary { background: #4285f4; color: white; }
  .grabcal-button-secondary { background: #34a853; color: white; }
  .grabcal-button:hover { opacity: 0.9; transform: translateY(-1px); }
</style>
<div class="grabcal-container">
  <div class="grabcal-header">
    <h2>📅 Event Found</h2>
    <button class="grabcal-close" data-close-modal aria-label="Close">×</button>
  </div>
  <div class="grabcal-details">
    <p><strong>Title:</strong> ${escapeHTML(event.title)}</p>
    <p><strong>Date:</strong> ${formatDisplayDate(event.startDate)}</p>
    ${event.endDate ? `<p><strong>End:</strong> ${formatDisplayDate(event.endDate)}</p>` : ''}
    ${event.location ? `<p><strong>Location:</strong> ${escapeHTML(event.location)}</p>` : ''}
    ${event.description ? `<p><strong>Description:</strong> ${escapeHTML(event.description)}</p>` : ''}
  </div>
  <div class="grabcal-buttons">
    <a href="${googleURL}" target="_blank" class="grabcal-button grabcal-button-primary">Add to Google Calendar</a>
    <a href="${icsURL}" download="event.ics" class="grabcal-button grabcal-button-secondary">Download ICS File</a>
  </div>
</div>`;
}

function generateMultipleHTML(events) {
  const eventItems = events.map((event, index) => {
    const googleURL = generateGoogleCalendarURL(event);
    const icsURL = generateICS(event);

    return `
      <div class="grabcal-item">
        <h3>${escapeHTML(event.title)}</h3>
        <p><strong>Date:</strong> ${formatDisplayDate(event.startDate)}</p>
        ${event.location ? `<p><strong>Location:</strong> ${escapeHTML(event.location)}</p>` : ''}
        <div class="grabcal-item-buttons">
          <a href="${googleURL}" target="_blank" class="grabcal-button grabcal-button-primary">Add to Google Calendar</a>
          <a href="${icsURL}" download="event-${index}.ics" class="grabcal-button grabcal-button-secondary">Download ICS</a>
        </div>
      </div>
    `;
  }).join('');

  return `
<style>
  .grabcal-container { padding: 30px; }
  .grabcal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .grabcal-header h2 { margin: 0; font-size: 22px; color: #333; }
  .grabcal-close { background: none; border: none; font-size: 28px; color: #999; cursor: pointer; padding: 0; width: 32px; height: 32px; line-height: 1; }
  .grabcal-close:hover { color: #333; }
  .grabcal-item { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 15px; }
  .grabcal-item h3 { margin: 0 0 10px 0; font-size: 18px; color: #333; }
  .grabcal-item p { margin: 5px 0; font-size: 14px; color: #666; }
  .grabcal-item-buttons { display: flex; gap: 10px; margin-top: 12px; }
  .grabcal-button { display: block; padding: 12px; text-align: center; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 13px; flex: 1; transition: all 0.2s; }
  .grabcal-button-primary { background: #4285f4; color: white; }
  .grabcal-button-secondary { background: #34a853; color: white; }
  .grabcal-button:hover { opacity: 0.9; transform: translateY(-1px); }
</style>
<div class="grabcal-container">
  <div class="grabcal-header">
    <h2>📅 Multiple Events Found</h2>
    <button class="grabcal-close" data-close-modal aria-label="Close">×</button>
  </div>
  ${eventItems}
</div>`;
}

function generateErrorHTML(message) {
  return `
<style>
  .grabcal-container { padding: 30px; }
  .grabcal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .grabcal-header h2 { margin: 0; font-size: 22px; color: #333; }
  .grabcal-close { background: none; border: none; font-size: 28px; color: #999; cursor: pointer; padding: 0; width: 32px; height: 32px; line-height: 1; }
  .grabcal-close:hover { color: #333; }
  .grabcal-error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; color: #c33; }
  .grabcal-error p { margin: 0 0 10px 0; font-size: 14px; line-height: 1.5; }
  .grabcal-error p:last-child { margin: 10px 0 0 0; }
  .grabcal-hint { color: #999; font-size: 13px; }
</style>
<div class="grabcal-container">
  <div class="grabcal-header">
    <h2>❌ No Event Found</h2>
    <button class="grabcal-close" data-close-modal aria-label="Close">×</button>
  </div>
  <div class="grabcal-error">
    <p>${escapeHTML(message)}</p>
    <p class="grabcal-hint">💡 Check the browser console (F12) for debugging information</p>
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
  // Extract date/time components directly from ISO string to preserve local time
  // Format: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ss±HH:mm
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);

  if (match) {
    const [, year, month, day, hours, minutes] = match;

    // Create a date object in UTC with these components, then format it
    // This prevents timezone conversion
    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));

    // Format using UTC to prevent timezone shifts
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  }

  // Fallback: use standard Date parsing (may have timezone issues)
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

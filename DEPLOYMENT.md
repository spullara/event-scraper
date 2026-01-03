# Deployment Guide

## Pre-Deployment Checklist

✅ API endpoint tested locally
✅ Bookmarklet code ready
✅ Environment variables configured

## Steps to Deploy

### 1. Deploy to Vercel

From the project directory, run:

```bash
vercel --prod
```

This will:
- Build and deploy your application
- Provide you with a production URL (e.g., `https://event-scraper.vercel.app`)

### 2. Set Environment Variables in Vercel

After deployment, set the environment variable:

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select the `event-scraper` project
3. Go to Settings → Environment Variables
4. Add the following variable:
   - **Name**: `GOOGLE_GENERATIVE_AI_API_KEY`
   - **Value**: Your Gemini API key
   - **Environment**: Production (and optionally Preview/Development)
5. Click "Save"

### 3. Redeploy to Apply Environment Variables

After adding environment variables, trigger a new deployment:

```bash
vercel --prod
```

Or use the Vercel dashboard to redeploy.

### 4. Update Bookmarklet URL

Once deployed, you need to update the API URL in the bookmarklet:

1. Open `public/index.html`
2. Find the bookmarklet code (the long `javascript:` URL)
3. Replace `http://localhost:3000/api/extract-event` with your production URL:
   `https://your-app.vercel.app/api/extract-event`
4. Commit and push the change
5. Redeploy

**Note**: You can use a find-and-replace to update the URL in the minified bookmarklet code.

### 5. Test the Production Bookmarklet

1. Visit your production URL (e.g., `https://event-scraper.vercel.app`)
2. Drag the bookmarklet to your bookmarks bar
3. Test it on a page with event information
4. Verify that events are extracted and calendar links work

## Production URL Structure

After deployment, your app will have:

- **Homepage**: `https://your-app.vercel.app/` (bookmarklet installation page)
- **API Endpoint**: `https://your-app.vercel.app/api/extract-event`

## Troubleshooting

### API Key Not Working

- Verify the environment variable name is exactly: `GOOGLE_GENERATIVE_AI_API_KEY`
- Check that the variable is set for the Production environment
- Redeploy after adding environment variables

### Bookmarklet Not Working

- Check browser console for errors
- Verify the API URL in the bookmarklet matches your production URL
- Ensure popups are allowed for the site you're testing on

### CORS Issues

The API is configured to allow all origins (`Access-Control-Allow-Origin: *`). If you want to restrict this in production, update the CORS headers in `api/extract-event.js`.

## Post-Deployment

After successful deployment:

1. Update the README with your production URL
2. Share the bookmarklet installation page with users
3. Monitor Vercel logs for any errors
4. Consider setting up analytics to track usage

## Updating the Bookmarklet

If you make changes to the bookmarklet code:

1. Update `bookmarklet/bookmarklet.js`
2. Minify the code (you can use online tools or build scripts)
3. Update the `href` in `public/index.html`
4. Commit and deploy

## Cost Considerations

- **Vercel**: Free tier includes 100GB bandwidth and 100 hours of serverless function execution
- **Gemini API**: Check Google's pricing for the Gemini 2.0 Flash model
- Monitor usage to stay within free tier limits or upgrade as needed


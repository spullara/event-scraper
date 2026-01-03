# Domain Setup - grabcal.com

## ✅ Setup Complete!

Your event scraper is now live at **https://grabcal.com**

## Domain Details

- **Domain**: grabcal.com
- **Registrar**: AWS Route 53
- **DNS**: AWS Route 53 Hosted Zone
- **Hosting**: Vercel
- **SSL**: ✅ Active (Let's Encrypt via Vercel)
- **Auto-Renew**: ✅ Enabled

## URLs

- **Main Site**: https://grabcal.com
- **Test Event Page**: https://grabcal.com/test-event.html
- **API Endpoint**: https://grabcal.com/api/extract-event

## DNS Configuration

### Route 53 Hosted Zone
- **Zone ID**: Z019799128IA5NPONYQT5
- **Nameservers**:
  - ns-590.awsdns-09.net
  - ns-345.awsdns-43.com
  - ns-1741.awsdns-25.co.uk
  - ns-1361.awsdns-42.org

### DNS Records
```
grabcal.com          A      76.76.21.21 (Vercel)
www.grabcal.com      CNAME  cname.vercel-dns.com
```

## AWS Route 53 Operations

### Domain Registration
- **Operation ID**: b88a5084-37be-41d1-9430-24ebfecd023a
- **Status**: SUCCESSFUL
- **Registered**: 2026-01-03

### Nameserver Update
- **Operation ID**: bc8dd36d-6b9f-468d-b431-971e0d0ccdec
- **Status**: Complete

## Verification

### Check Domain Status
```bash
# Check domain registration
aws route53domains get-domain-detail --domain-name grabcal.com --region us-east-1

# Check DNS records
aws route53 list-resource-record-sets --hosted-zone-id Z019799128IA5NPONYQT5

# Test DNS resolution
dig grabcal.com
dig www.grabcal.com

# Test HTTPS
curl -I https://grabcal.com
```

### Test the Site
```bash
# Main page
curl -s https://grabcal.com | grep '<title>'

# Test event page
curl -s https://grabcal.com/test-event.html | grep '<title>'

# API endpoint
curl -X POST https://grabcal.com/api/extract-event \
  -H "Content-Type: application/json" \
  -d '{"text":"Test event on January 15, 2026 at 3pm"}'
```

## Bookmarklet Configuration

The bookmarklet is configured to use the production domain:
- **API URL**: `https://grabcal.com/api/extract-event`

## Costs

### Domain Registration
- **Initial**: ~$12-13/year (.com domain)
- **Renewal**: Auto-renew enabled
- **Privacy Protection**: Included (free)

### Route 53 Hosting
- **Hosted Zone**: $0.50/month
- **DNS Queries**: $0.40 per million queries (first 1 billion queries/month)

### Vercel Hosting
- **Current Plan**: Free tier (Hobby)
- **SSL Certificate**: Free (Let's Encrypt)
- **Bandwidth**: 100 GB/month included

## Maintenance

### Domain Renewal
- Auto-renew is enabled
- Check status: `aws route53domains get-domain-detail --domain-name grabcal.com --region us-east-1`

### SSL Certificate
- Automatically renewed by Vercel
- No action required

### DNS Updates
To update DNS records:
```bash
# Create a change batch JSON file
cat > change-batch.json << EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "grabcal.com",
      "Type": "A",
      "TTL": 300,
      "ResourceRecords": [{"Value": "NEW_IP_ADDRESS"}]
    }
  }]
}
EOF

# Apply changes
aws route53 change-resource-record-sets \
  --hosted-zone-id Z019799128IA5NPONYQT5 \
  --change-batch file://change-batch.json
```

## Troubleshooting

### SSL Certificate Issues
If SSL stops working:
1. Check Vercel dashboard: https://vercel.com/spullaras-projects/event-scraper
2. Verify DNS is pointing to Vercel: `dig grabcal.com`
3. Wait 5-10 minutes for certificate renewal

### DNS Not Resolving
1. Check nameservers: `dig NS grabcal.com`
2. Verify Route 53 records: `aws route53 list-resource-record-sets --hosted-zone-id Z019799128IA5NPONYQT5`
3. DNS propagation can take up to 48 hours (usually much faster)

### Domain Transfer
If you need to transfer the domain:
1. Unlock domain: `aws route53domains disable-domain-transfer-lock --domain-name grabcal.com --region us-east-1`
2. Get auth code: `aws route53domains retrieve-domain-auth-code --domain-name grabcal.com --region us-east-1`
3. Initiate transfer at new registrar

## Next Steps

1. ✅ Domain registered and configured
2. ✅ SSL certificate active
3. ✅ Bookmarklet updated to use grabcal.com
4. ✅ All pages accessible via HTTPS

**Your event scraper is ready to use at https://grabcal.com!** 🎉


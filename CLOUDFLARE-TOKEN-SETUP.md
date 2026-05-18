# Cloudflare API Token Permissions Needed

For `wrangler` to deploy Barashop, the API token needs these permissions:

## Required Permissions (in Cloudflare Dashboard → My Profile → API Tokens → Edit Token)

### Permission Groups:
- **Account → Cloudflare Pages** → Edit
- **Account → Workers Scripts** → Edit  
- **Account → Workers Routes** → Edit
- **User → Access: Groups** → Read
- **User → Access: Users** → Read

### Zone Permissions (if custom domain needed):
- **Zone → Zone** → Read
- **Zone → DNS** → Edit

## Current Token Status
- Token stored in: `~/.credentials/cloudflare.json`
- Can query: `accounts`, `zones` (returns empty)
- Cannot: Create projects via wrangler

## Fix Options

**Option 1: Create new token with correct scopes**
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create token with above permissions
3. Replace content in `~/.credentials/cloudflare.json`

**Option 2: Manual deployment (current state)**
- Use `barashop-deployment.zip` for direct upload
- No API token needed

**Option 3: GitHub integration**
- Push to GitHub
- Connect in Cloudflare Pages dashboard
- No API token needed (uses GitHub OAuth)

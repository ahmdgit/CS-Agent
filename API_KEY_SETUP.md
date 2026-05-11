# API Key Management & Multi-Key Fallback Guide

## Overview

The CS-Agent now supports **multiple API keys with automatic fallback**. When one API key exceeds its quota (rate limit or daily usage limit), the system automatically switches to the next available key, ensuring uninterrupted service.

---

## How to Add API Keys

### Option 1: Environment Variable (Recommended for Production)

#### Setup Multiple Keys

1. **Create a `.env` file** in the project root:
```bash
GEMINI_API_KEYS="sk-proj-key1,sk-proj-key2,sk-proj-key3,sk-proj-key4,sk-proj-key5"
```

2. **Or set multiple keys during deployment**:
   - GitHub Actions: Add to repository Secrets as `GEMINI_API_KEYS`
   - Cloud Run/Docker: Export as environment variable

#### Format:
```
GEMINI_API_KEYS="key1,key2,key3,key4,key5,key6,key7,key8,key9,key10"
```

- Comma-separated (no spaces around commas)
- Supports 1-10+ keys
- System auto-detects and uses the first available key

---

### Option 2: Application Settings UI

1. Open the app at **https://ahmdgit.github.io/CS-Agent/**
2. Sign in with your Google account
3. Navigate to **Settings Tab** (gear icon 🔧)
4. Find **"API Keys"** section
5. Paste your keys in the format:
   ```
   sk-proj-key1,sk-proj-key2,sk-proj-key3
   ```
6. Click **Save** - Keys are stored securely in browser localStorage

---

### Option 3: Single Key (Backward Compatible)

If you have only one API key, use:
```
GEMINI_API_KEY="sk-proj-xxxxxxxxx"
```

---

## How It Works

### Fallback Priority

1. **Check first API key** → If quota OK, use it
2. **Quota exceeded?** → Automatically switch to **Key #2**
3. **Key #2 exhausted?** → Try **Key #3**
4. **All keys exhausted?** → Show error asking for more keys

### Model Fallback (Additional)

If the primary model (`gemini-3-flash-preview`) fails:
- Falls back to `gemini-2.5-flash`
- With automatic API key rotation

### Combined Fallback Strategy

```
API Key #1 + Model A
   ↓ (Quota exceeded)
API Key #2 + Model A
   ↓ (Quota exceeded)
API Key #1 + Model B (Fallback Model)
   ↓ (Quota exceeded)
API Key #2 + Model B
   ↓ (Still failing?)
Error: All keys exhausted
```

---

## Monitoring API Key Status

### In Browser Console

1. Open DevTools: `F12` or `Right-click → Inspect`
2. Go to **Console** tab
3. Run:
```javascript
import { getApiKeyManager_ } from '/src/services/geminiClient.ts';
const manager = getApiKeyManager_();
console.log(manager.getStatus());
```

Output:
```json
{
  "totalKeys": 5,
  "currentKeyIndex": 1,
  "keys": [
    {"index": 1, "exhausted": false, "failedAttempts": 0, "active": true},
    {"index": 2, "exhausted": true, "failedAttempts": 2, "lastError": "429 Too Many Requests"},
    {"index": 3, "exhausted": false, "failedAttempts": 0, "active": false},
    ...
  ]
}
```

### Console Logs

When switching keys, you'll see:
```
🔑 Loaded 5 API key(s) for fallback
⚠️ Quota exceeded with current key. (429)
✅ Now using API key 2/5
```

---

## Setting Up for Production

### GitHub Pages with GitHub Actions

1. Go to your GitHub repository
2. Navigate to **Settings → Secrets and variables → Actions**
3. Create a new secret: `GEMINI_API_KEYS`
4. Paste your comma-separated keys:
   ```
   key1,key2,key3,key4,key5
   ```
5. The `.github/workflows/deploy.yml` will automatically use these keys

### Testing the Setup

```bash
# Local development
echo "GEMINI_API_KEYS=key1,key2,key3" > .env
npm run dev

# Check if keys are loaded
npm run build
```

---

## Example: 5 API Keys Setup

### Step 1: Get 5 Google Gemini API Keys

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create API key (repeat 5 times)
3. Copy each key

### Step 2: Add to Environment

**`.env` file**:
```
GEMINI_API_KEYS="sk-proj-abc123,sk-proj-def456,sk-proj-ghi789,sk-proj-jkl012,sk-proj-mno345"
```

### Step 3: Test

```bash
npm run dev
```

Open app and trigger API calls. Monitor console for automatic key switching.

---

## Troubleshooting

### ❌ "No API keys available"

**Issue**: App can't find any API keys.

**Solution**:
1. Check `.env` file exists
2. Verify `GEMINI_API_KEYS` or `GEMINI_API_KEY` is set
3. Restart dev server: `npm run dev`
4. Hard refresh browser: `Ctrl+Shift+R`

### ❌ "All API keys exhausted"

**Issue**: All keys have exceeded quota.

**Solution**:
1. Add more API keys (create new ones in Google AI Studio)
2. Or wait for quota reset (usually next day)
3. Reset quota tracking:
   ```javascript
   const manager = getApiKeyManager_();
   manager.resetQuotaTracking();
   ```

### ⚠️ Only one key and it's exhausted

**Issue**: You have 1 key and it hit quota limit.

**Solution**:
1. Add more keys: `GEMINI_API_KEYS="key1,key2,key3"`
2. Or use a different account's API key
3. Or wait 24 hours for quota reset

---

## Best Practices

✅ **DO:**
- Add 5-10 API keys for production use
- Use different Google accounts for each key
- Rotate keys monthly
- Monitor key status in console
- Set up alerts for quota exhaustion

❌ **DON'T:**
- Commit API keys to GitHub (use GitHub Secrets)
- Share API keys in logs
- Use same key across multiple apps
- Leave expired keys in the list

---

## API Key Generation

### How to Get Free Google Gemini API Keys

1. Visit: https://aistudio.google.com/app/apikey
2. Click **"Create API Key in New Project"**
3. Copy the key (starts with `sk-proj-`)
4. Repeat steps 1-3 to create 5-10 keys
5. Add them to your app

### Free Tier Limits

- **Requests/Minute**: 15
- **Requests/Day**: 1,500
- **Characters/Day**: 1,000,000

With 5 keys:
- **Requests/Day**: 7,500
- **Characters/Day**: 5,000,000

---

## Integration Code Example

If you're using this in your own project:

```typescript
import { generateWithFallback } from './src/services/geminiClient';
import { getApiKeyManager_ } from './src/services/geminiClient';

// Generate with automatic API key fallback
const response = await generateWithFallback({
  contents: "Your prompt here",
  config: { temperature: 1 }
});

// Check current status
const manager = getApiKeyManager_();
console.log(manager.getStatus());

// Reset quota tracking (daily)
manager.resetQuotaTracking();
```

---

## Support

For issues or questions:
- Check console logs (F12 → Console tab)
- Review `.env` file configuration
- Verify API keys are valid
- Check Google AI Studio for key status


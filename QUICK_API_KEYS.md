# Quick Start: Adding Your API Keys

## 🎯 Where to Add API Keys (3 Options)

---

## ✅ **OPTION 1: Environment Variable (Best for Production)**

### For Local Development:

**1. Create `.env` file** in project root:
```
GEMINI_API_KEYS="key1,key2,key3,key4,key5"
```

**2. Or if you have single key:**
```
GEMINI_API_KEY="your-single-key"
```

**3. Restart development server:**
```bash
npm run dev
```

---

### For GitHub Pages / Deployment:

1. Go to GitHub: **https://github.com/ahmdgit/CS-Agent**
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. **Name**: `GEMINI_API_KEYS`
5. **Value**: `key1,key2,key3,key4,key5` (comma-separated)
6. Click **Add secret**

✅ Your app will now automatically use these keys when deployed!

---

## ✅ **OPTION 2: In-App Settings (Best for Testing)**

1. Open: **https://ahmdgit.github.io/CS-Agent/**
2. Sign in with Google
3. Click **Settings** ⚙️ (or find API Keys section)
4. Paste your keys:
   ```
   key1,key2,key3,key4,key5
   ```
5. Click **Save**

✅ Keys saved in browser (localStorage)

---

## ✅ **OPTION 3: Browser DevTools Console**

For quick testing, paste in browser console (F12):
```javascript
localStorage.setItem('CUSTOM_GEMINI_API_KEYS', 'key1,key2,key3');
location.reload();
```

---

## 📋 How to Format Multiple Keys

### Single line with commas (NO SPACES):
```
sk-proj-abc123,sk-proj-def456,sk-proj-ghi789
```

### How many keys?
- **Minimum**: 1 key
- **Recommended**: 5-10 keys
- **Maximum**: Unlimited (but system will rotate through them)

### Example with 5 keys:
```
GEMINI_API_KEYS="sk-proj-111111,sk-proj-222222,sk-proj-333333,sk-proj-444444,sk-proj-555555"
```

---

## 🔑 Get Free API Keys

1. Go: https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Copy the key
4. Repeat 5-10 times (use different Google accounts for more quota)

---

## ✨ How It Works (Automatic Fallback)

```
Request starts with Key #1
    ↓
✅ Works? → Done!
    ↓ (429 Quota Error)
❌ Quota exceeded? → Switch to Key #2
    ↓
✅ Works? → Done!
    ↓ (429 Quota Error)
❌ Quota exceeded? → Switch to Key #3
    ↓
...and so on with Keys #4, #5, etc.
```

---

## 🛠️ Check What's Currently Active

Open browser console (F12):
```javascript
// Check current key status
const manager = getApiKeyManager_();
console.log(manager.getStatus());
```

You'll see:
```json
{
  "totalKeys": 5,
  "currentKeyIndex": 1,
  "keys": [
    {"index": 1, "exhausted": false, "failedAttempts": 0, "active": true},
    {"index": 2, "exhausted": true, "failedAttempts": 2, "lastError": "429 Too Many Requests"},
    ...
  ]
}
```

---

## ⚠️ Troubleshooting

### Problem: "No API keys available"
**Solution**: 
- Check `.env` file has `GEMINI_API_KEYS="..."`
- Or add keys in Settings
- Restart: `npm run dev`

### Problem: "All keys exhausted"
**Solution**:
- Add more API keys
- Or wait 24 hours for daily quota reset
- Reset quota: `getApiKeyManager_().resetQuotaTracking()`

### Problem: Keys not loading
**Solution**:
1. Hard refresh: `Ctrl+Shift+R`
2. Check browser localStorage (DevTools → Application → Storage)
3. Check `.env` file exists and is in root directory

---

## 📁 File Locations

| What | Where |
|------|-------|
| **Config** | `.env.example` (see format) |
| **Logic** | `src/services/apiKeyManager.ts` |
| **Integration** | `src/services/geminiClient.ts` |
| **Full Guide** | `API_KEY_SETUP.md` |

---

## 🚀 Summary

1. **Get 5 API keys** from https://aistudio.google.com/app/apikey
2. **Choose Option 1, 2, or 3** to add keys
3. **System automatically rotates** when quota hits
4. **Monitor status** in browser console
5. **Done!** 🎉

---

For detailed docs, see: **[API_KEY_SETUP.md](./API_KEY_SETUP.md)**

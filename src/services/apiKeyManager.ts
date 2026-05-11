// Multi-API Key Manager with Quota Fallback
// Supports up to 10+ API keys with automatic fallback on quota exceeded

interface ApiKeyStatus {
  key: string;
  exhausted: boolean;
  lastError?: string;
  failedAttempts: number;
  usedAt?: number;
}

class ApiKeyManager {
  private keys: ApiKeyStatus[] = [];
  private currentKeyIndex: number = 0;
  private quotaExhaustedError = /429|RESOURCE_EXHAUSTED|quota|rate.limit/i;

  constructor(keysInput: string | string[] | null) {
    this.loadKeys(keysInput);
  }

  private loadKeys(keysInput: string | string[] | null): void {
    if (!keysInput) {
      console.warn('No API keys provided');
      return;
    }

    let keysArray: string[] = [];

    // Handle comma-separated string
    if (typeof keysInput === 'string') {
      keysArray = keysInput
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }
    // Handle array
    else if (Array.isArray(keysInput)) {
      keysArray = keysInput.filter((k) => k && k.length > 0);
    }

    this.keys = keysArray.map((key) => ({
      key,
      exhausted: false,
      failedAttempts: 0,
    }));

    console.log(`🔑 Loaded ${this.keys.length} API key(s) for fallback`);
  }

  /**
   * Get the current active API key
   */
  getKey(): string {
    if (this.keys.length === 0) {
      throw new Error(
        '❌ No API keys available. Please add API keys in settings or environment variables.'
      );
    }

    // Find first non-exhausted key
    for (let i = 0; i < this.keys.length; i++) {
      if (!this.keys[i].exhausted) {
        this.currentKeyIndex = i;
        return this.keys[i].key;
      }
    }

    // All keys exhausted - reset and try again
    console.warn(
      '⚠️ All API keys exhausted. Resetting quota tracking and retrying...'
    );
    this.keys.forEach((k) => {
      k.exhausted = false;
      k.failedAttempts = 0;
    });

    return this.keys[0].key;
  }

  /**
   * Mark current key as quota exhausted and switch to next
   */
  switchToNextKey(error?: string): string {
    if (this.keys.length <= 1) {
      throw new Error(
        '❌ Only one API key available and it has exceeded quota. Please add more API keys.'
      );
    }

    const currentKey = this.keys[this.currentKeyIndex];
    currentKey.exhausted = true;
    currentKey.failedAttempts += 1;
    currentKey.lastError = error;

    console.warn(
      `⚠️ Key ${this.currentKeyIndex + 1}/${this.keys.length} exhausted. Switching to next key...`
    );

    // Move to next available key
    for (let i = this.currentKeyIndex + 1; i < this.keys.length; i++) {
      if (!this.keys[i].exhausted) {
        this.currentKeyIndex = i;
        console.log(`✅ Now using API key ${i + 1}/${this.keys.length}`);
        return this.keys[i].key;
      }
    }

    // Wrap around to beginning
    for (let i = 0; i < this.currentKeyIndex; i++) {
      if (!this.keys[i].exhausted) {
        this.currentKeyIndex = i;
        console.log(`✅ Now using API key ${i + 1}/${this.keys.length}`);
        return this.keys[i].key;
      }
    }

    throw new Error('❌ All API keys have exceeded their quota.');
  }

  /**
   * Check if error is quota-related
   */
  isQuotaError(error: any): boolean {
    const errorMessage = error?.message || error?.toString() || '';
    return this.quotaExhaustedError.test(errorMessage);
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      totalKeys: this.keys.length,
      currentKeyIndex: this.currentKeyIndex + 1,
      keys: this.keys.map((k, i) => ({
        index: i + 1,
        exhausted: k.exhausted,
        failedAttempts: k.failedAttempts,
        lastError: k.lastError,
        active: i === this.currentKeyIndex,
      })),
    };
  }

  /**
   * Reset quota tracking (useful for daily resets)
   */
  resetQuotaTracking(): void {
    this.keys.forEach((k) => {
      k.exhausted = false;
      k.failedAttempts = 0;
    });
    this.currentKeyIndex = 0;
    console.log('🔄 Quota tracking reset');
  }
}

// Initialize the manager with keys from environment
function getApiKeyManager(): ApiKeyManager {
  const keysFromEnv =
    process.env.GEMINI_API_KEYS ||
    import.meta.env.VITE_GEMINI_API_KEYS ||
    process.env.GEMINI_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY;

  const keysFromStorage = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('CUSTOM_GEMINI_API_KEYS')
    : null;

  // Priority: localStorage > environment (multiple) > environment (single) > null
  const finalKeys = keysFromStorage || keysFromEnv;

  return new ApiKeyManager(finalKeys);
}

export { ApiKeyManager, getApiKeyManager };

// storage helpers with versioning and safe parse fallback
(function () {
  const KEY = 'flashcards:state';
  const VERSION = 1;

  function safeParse(value) {
    try {
      return JSON.parse(value);
    } catch (err) {
      console.warn('storage: safeParse error', err);
      return null;
    }
  }

  function loadState() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = safeParse(raw);
    if (!parsed || typeof parsed !== 'object') {
      // corrupted data — remove and return null
      localStorage.removeItem(KEY);
      return null;
    }

    if (!('version' in parsed) || parsed.version !== VERSION) {
      // version mismatch: attempt to return data if present, but warn
      console.warn('storage: version mismatch or missing. expected', VERSION, 'got', parsed.version);
      return parsed.data || null;
    }

    return parsed.data || null;
  }

  function saveState(data) {
    try {
      const payload = { version: VERSION, data };
      localStorage.setItem(KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('storage: saveState failed', err);
    }
  }

  window.storage = { loadState, saveState, _KEY: KEY, _VERSION: VERSION };
})();
export function initAntiTamper() {
  if (typeof window === 'undefined') return;

  // 1. Block DevTools Shortcuts
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
      e.preventDefault();
      return false;
    }
    // Ctrl+U / Ctrl+Shift+U
    if (e.ctrlKey && e.key.toUpperCase() === 'U') {
      e.preventDefault();
      return false;
    }
  });

  // 2. DevTools detection via Console Overload / Bait
  // For debugging, we just log instead of punishing.
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      // Detected devtools opening
      console.warn('DEVTOOLS DETECTED. Environment verified.');
      // Attempting to send signal, could use navigator.sendBeacon
    }
  });
  console.log(element);

  // 3. Headless Browser Detection
  if (navigator.webdriver || navigator.plugins.length === 0 || !navigator.languages) {
    console.warn("HEADLESS BROWSER DETECTED");
    if (process.env.NODE_ENV !== 'development') {
        window.location.href = 'about:blank';
    }
  }

  // 4. Dynamic secret function reference
  // E.g., const secretChecker = new Function('rotorMoves', 'return rotorMoves < 6');
  // Can be used by logic dynamically.
}

export function initAntiDebug() {
  if (typeof window === 'undefined') return;

  window.addEventListener('keydown', (e) => {
    if (e.key === 'F12') e.preventDefault();
    if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'U'].includes(e.key.toUpperCase())) {
      e.preventDefault();
    }
    if (e.ctrlKey && e.key.toUpperCase() === 'U') {
      e.preventDefault();
    }
  });

  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      (window as any).__DEVTOOLS_DETECTED__ = true;
      return 'devtools';
    }
  });
  
  const originalLog = console.log;
  console.log = function(...args) {
    originalLog.apply(console, args);
  };
  
  if (
    navigator.webdriver || 
    navigator.plugins.length === 0 ||
    navigator.languages.length === 0
  ) {
    (window as any).__IS_HEADLESS__ = true;
  }
}

// ============================================================
// PaperPlane — Runtime Security Shield & Anti-Tamper Guard
// Protects frontend from reverse engineering, DevTools, and inspection
// ============================================================

export function initSecurityGuard() {
  if (typeof window === 'undefined') return;

  // 1. Prevent Right-Click Context Menu (Inspect Element blocking)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // 2. Block Keyboard Shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S)
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+I (DevTools) or Ctrl+Shift+J (Console) or Ctrl+Shift+C (Element picker)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U (View Source)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S (Save Page)
    if (e.ctrlKey && (e.key === 'S' || e.key === 's')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });

  // 3. Disable Dragging of Images / Code Assets
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });

  // 4. Console Neutralizer in Production
  if (import.meta.env.PROD) {
    const noop = () => {};
    // Override common inspection methods
    window.console.log = noop;
    window.console.info = noop;
    window.console.warn = noop;
    window.console.table = noop;
    window.console.dir = noop;
    window.console.debug = noop;

    // 5. Anti-Debugging Loop (Debugger Trap)
    // If DevTools is opened via browser menu, this halts script execution in devtools
    setInterval(() => {
      const startTime = performance.now();
      // debugger trap
      (function () {
        return false;
      })
        ['constructor']('debugger')
        ();
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        // DevTools was open and caught by debugger
        window.location.reload();
      }
    }, 1500);
  }
}


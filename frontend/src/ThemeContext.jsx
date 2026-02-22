import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ── Ensure <html> starts with data-theme="light" immediately ──
// This runs once when the module is loaded, before any React render,
// preventing any flash of dark content.
if (typeof document !== 'undefined') {
  const saved = localStorage.getItem('freshbasket-theme');
  document.documentElement.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');
}

export const ThemeProvider = ({ children }) => {
  // Default is ALWAYS 'light'. Dark mode is only activated when the user
  // has explicitly toggled it (stored as 'dark' in localStorage).
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('freshbasket-theme');
    // Only honour 'dark' — every other value (null, 'light', garbage) → light
    return saved === 'dark' ? 'dark' : 'light';
  });

  // Keep <html data-theme="..."> and localStorage in sync
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('freshbasket-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

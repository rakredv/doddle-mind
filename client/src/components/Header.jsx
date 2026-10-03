import { useState } from 'react';

const current = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

export default function Header({ onHome, showHome }) {
  const [theme, setTheme] = useState(current);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // storage unavailable; theme still applies for this session
    }
    setTheme(next);
  }

  return (
    <header className="no-print mx-auto flex max-w-[960px] items-center justify-between px-5 py-5">
      <button onClick={onHome} className="flex items-center gap-2 text-[17px] font-semibold tracking-tight" aria-label="Doodle Mind home">
        <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-accent text-sm text-white">✎</span>
        Doodle Mind
      </button>
      <div className="flex items-center gap-1">
        {showHome && (
          <button onClick={onHome} className="btn-ghost text-sm">
            New diagram
          </button>
        )}
        <button
          onClick={toggle}
          aria-pressed={theme === 'dark'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="btn-ghost grid h-9 w-9 place-items-center !p-0 text-lg"
        >
          <span aria-hidden>{theme === 'dark' ? '☀' : '☾'}</span>
        </button>
      </div>
    </header>
  );
}

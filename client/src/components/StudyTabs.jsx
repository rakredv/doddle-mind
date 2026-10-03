const TABS = [
  { id: 'written', label: 'Written' },
  { id: 'cards', label: 'Flash cards' },
  { id: 'quiz', label: 'Quiz' },
];

// Accessible tablist; arrow keys move between tabs.
export default function StudyTabs({ mode, onChange }) {
  function onKeyDown(e) {
    const i = TABS.findIndex((t) => t.id === mode);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const tab = TABS[(next + TABS.length) % TABS.length];
    onChange(tab.id);
    document.getElementById(`tab-${tab.id}`)?.focus();
  }

  return (
    <div role="tablist" aria-label="Practice mode" onKeyDown={onKeyDown} className="inline-flex gap-1 rounded-full border border-line bg-surface p-1">
      {TABS.map((t) => {
        const on = t.id === mode;
        return (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={on}
            aria-controls="practice-panel"
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={`rounded-full px-5 py-2 text-sm transition-colors ${on ? 'bg-accent text-white' : 'text-muted hover:text-ink'}`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

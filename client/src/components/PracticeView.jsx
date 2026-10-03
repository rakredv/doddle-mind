import StudyTabs from './StudyTabs.jsx';

export default function PracticeView({ mode, onMode, onCard, children }) {
  return (
    <section className="rise">
      <h1 className="headline text-4xl sm:text-5xl">Test yourself.</h1>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <StudyTabs mode={mode} onChange={onMode} />
        <button onClick={onCard} className="btn-ghost text-sm">Revision card</button>
      </div>
      <div id="practice-panel" role="tabpanel" aria-labelledby={`tab-${mode}`} className="mt-8">
        {children}
      </div>
    </section>
  );
}
